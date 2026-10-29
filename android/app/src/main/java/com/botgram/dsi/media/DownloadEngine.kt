package com.botgram.dsi.media

import android.content.Context
import android.os.Handler
import android.os.Looper
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executors

/** Demande de téléchargement venue du JS. */
class DownloadRequest(
    val id: String,
    val url: String,
    val destPath: String,
    val headers: Map<String, String>,
    val maxBytes: Long,
)

/** Retour vers l'appelant (le module JS). Appelé hors thread principal. */
interface DownloadCallback {
  fun onProgress(received: Long, total: Long)

  fun onSuccess(path: String, size: Long, mime: String)

  fun onError(code: String, message: String)
}

/** Un téléchargement en cours. Les champs sont lus par le service de notification. */
class DownloadJob(val id: String, val label: String, val kind: String) {
  @Volatile var received = 0L
  /** 0 = taille inconnue. */
  @Volatile var total = 0L
  /** Vrai quand le téléchargement dure assez longtemps pour mériter une notification. */
  @Volatile var visible = false
  /** Vrai quand le service a réellement affiché la notification. */
  @Volatile var shown = false
  val callbacks = CopyOnWriteArrayList<DownloadCallback>()
}

class DownloadException(val code: String, message: String) : Exception(message)

/**
 * Moteur de téléchargement natif, indépendant de React : il survit au rechargement du JS et
 * continue quand l'app passe en arrière-plan (le [DownloadService] maintient le processus).
 *
 * - Écrit dans `<dest>.part` puis renomme : jamais de fichier à moitié téléchargé.
 * - Aucune redirection suivie (le jeton Authorization ne doit jamais partir ailleurs).
 * - Si le même id est redemandé pendant qu'il tourne, le nouvel appelant se greffe sur le même job.
 * - Les petits téléchargements (moins de [SHOW_DELAY_MS]) n'affichent aucune notification.
 *
 * Codes d'erreur : http_<status> · PAYLOAD_TOO_LARGE · network_error · storage_full · cancelled
 */
object DownloadEngine {

  private const val SHOW_DELAY_MS = 700L
  private const val JS_PROGRESS_EVERY_MS = 100L
  private const val NOTIF_PROGRESS_EVERY_MS = 400L

  private val executor = Executors.newFixedThreadPool(3)
  private val main = Handler(Looper.getMainLooper())
  private val lock = Any()
  private val jobs = LinkedHashMap<String, DownloadJob>()
  private val cancelled = ConcurrentHashMap.newKeySet<String>()
  private val meta = ConcurrentHashMap<String, Pair<String, String>>()

  /** Nom affiché et type du fichier, à donner juste avant [start]. */
  fun describe(id: String, label: String, kind: String) {
    meta[id] = Pair(label, kind)
  }

  fun start(ctx: Context, req: DownloadRequest, cb: DownloadCallback) {
    val appCtx = ctx.applicationContext
    val created: DownloadJob? =
        synchronized(lock) {
          val existing = jobs[req.id]
          if (existing != null) {
            // Déjà en cours (ex. JS rechargé) : le nouvel appelant se greffe sur le même job.
            existing.callbacks.add(cb)
            null
          } else {
            val m = meta.remove(req.id)
            val job = DownloadJob(req.id, m?.first ?: "", m?.second ?: "")
            job.callbacks.add(cb)
            jobs[req.id] = job
            job
          }
        }
    val fresh = created ?: return
    cancelled.remove(req.id)

    main.postDelayed(
        {
          if (isActive(fresh)) {
            fresh.visible = true
            DownloadService.ensureStarted(appCtx, fresh)
          }
        },
        SHOW_DELAY_MS)

    executor.execute {
      var errorCode: String? = null
      var errorMessage = ""
      var result: DownloadResult? = null
      try {
        result = doDownload(fresh, req)
      } catch (e: DownloadException) {
        errorCode = e.code
        errorMessage = e.message ?: ""
      } catch (e: Exception) {
        errorCode = "network_error"
        errorMessage = e.message ?: "Erreur réseau"
      }
      finish(fresh, result, errorCode, errorMessage)
    }
  }

  fun cancel(id: String) {
    cancelled.add(id)
  }

  fun isActive(job: DownloadJob): Boolean = synchronized(lock) { jobs[job.id] === job }

  /** Téléchargements en cours, dans l'ordre de départ. */
  fun activeJobs(): List<DownloadJob> = synchronized(lock) { jobs.values.toList() }

  private class DownloadResult(val path: String, val size: Long, val mime: String)

  private fun finish(job: DownloadJob, result: DownloadResult?, code: String?, message: String) {
    synchronized(lock) { jobs.remove(job.id) }
    cancelled.remove(job.id)
    DownloadService.onEnd(job, code)
    for (cb in job.callbacks) {
      try {
        if (result != null) cb.onSuccess(result.path, result.size, result.mime)
        else cb.onError(code ?: "network_error", message)
      } catch (_: Throwable) {
        // un appelant défaillant ne doit pas empêcher les autres d'être prévenus
      }
    }
  }

  private fun doDownload(job: DownloadJob, req: DownloadRequest): DownloadResult {
    val dest = File(req.destPath)
    val part = File("${req.destPath}.part")
    var conn: HttpURLConnection? = null
    try {
      dest.parentFile?.mkdirs()
      val c = URL(req.url).openConnection() as HttpURLConnection
      conn = c
      c.connectTimeout = 20_000
      c.readTimeout = 30_000
      c.instanceFollowRedirects = false
      c.requestMethod = "GET"
      for ((k, v) in req.headers) c.setRequestProperty(k, v)

      val status = c.responseCode
      if (status == 413) throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
      if (status !in 200..299) throw DownloadException("http_$status", "Erreur HTTP $status")

      val total = c.contentLengthLong.coerceAtLeast(0L)
      if (total > req.maxBytes) {
        throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
      }
      job.total = total
      val mime = c.contentType ?: ""
      val compressed = !c.contentEncoding.isNullOrEmpty()

      var received = 0L
      var lastJs = 0L
      var lastNotif = 0L
      try {
        c.inputStream.use { input ->
          part.outputStream().buffered(64 * 1024).use { out ->
            val buf = ByteArray(64 * 1024)
            while (true) {
              if (cancelled.contains(job.id)) throw DownloadException("cancelled", "Annulé")
              val n = input.read(buf)
              if (n < 0) break
              received += n
              if (received > req.maxBytes) {
                throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
              }
              out.write(buf, 0, n)
              job.received = received
              val now = System.currentTimeMillis()
              if (now - lastJs >= JS_PROGRESS_EVERY_MS) {
                lastJs = now
                emitProgress(job, received, total)
              }
              if (now - lastNotif >= NOTIF_PROGRESS_EVERY_MS) {
                lastNotif = now
                DownloadService.onProgress(job)
              }
            }
          }
        }
      } catch (e: IOException) {
        val msg = e.message ?: ""
        if (msg.contains("ENOSPC") || msg.contains("No space")) {
          throw DownloadException("storage_full", "Espace de stockage insuffisant")
        }
        throw DownloadException("network_error", "Erreur réseau")
      }

      if (!compressed && total > 0 && received != total) {
        throw DownloadException("network_error", "Téléchargement incomplet")
      }
      job.received = received
      emitProgress(job, received, total)

      if (dest.exists()) dest.delete()
      if (!part.renameTo(dest)) {
        throw DownloadException("storage_full", "Impossible d'enregistrer le fichier")
      }
      return DownloadResult(dest.absolutePath, received, mime)
    } finally {
      conn?.disconnect()
      if (part.exists()) part.delete()
    }
  }

  private fun emitProgress(job: DownloadJob, received: Long, total: Long) {
    for (cb in job.callbacks) {
      try {
        cb.onProgress(received, total)
      } catch (_: Throwable) {}
    }
  }
}
