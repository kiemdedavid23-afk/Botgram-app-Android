package com.botgram.dsi.media

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Téléchargement natif direct vers le disque (plus de base64 en mémoire JS).
 *
 * JS : NativeModules.BotgramDownload
 *   download(id, url, destPath, headers, maxBytes) -> Promise<{path, size, mime}>
 *   cancel(id)
 * Événement : "botgramDownloadProgress" {id, received, total}  (total = 0 si inconnu)
 *
 * Codes de rejet : http_<status> · PAYLOAD_TOO_LARGE · network_error · storage_full · cancelled
 * Aucune redirection n'est suivie (le jeton Authorization ne doit jamais partir ailleurs).
 */
class MediaDownloadModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc) {

  private class DownloadException(val code: String, message: String) : Exception(message)

  private val executor = Executors.newFixedThreadPool(2)
  private val cancelled = ConcurrentHashMap.newKeySet<String>()

  override fun getName(): String = "BotgramDownload"

  @ReactMethod
  fun download(
      id: String,
      url: String,
      destPath: String,
      headers: ReadableMap?,
      maxBytes: Double,
      promise: Promise,
  ) {
    cancelled.remove(id)
    executor.execute {
      try {
        promise.resolve(doDownload(id, url, destPath, headers, maxBytes.toLong()))
      } catch (e: DownloadException) {
        promise.reject(e.code, e.message)
      } catch (e: Exception) {
        promise.reject("network_error", e.message ?: "Erreur réseau")
      } finally {
        cancelled.remove(id)
      }
    }
  }

  @ReactMethod
  fun cancel(id: String) {
    cancelled.add(id)
  }

  /**
   * Copie un fichier local (content:// du sélecteur, file:// ou chemin) vers `destPath`.
   * Sert à garder sur le téléphone les médias qu'on envoie : on peut les lire sans le Worker.
   * Résout avec la taille copiée.
   */
  @ReactMethod
  fun copyLocal(src: String, destPath: String, promise: Promise) {
    executor.execute {
      val dest = File(destPath)
      val part = File("$destPath.part")
      try {
        dest.parentFile?.mkdirs()
        val input =
            when {
              src.startsWith("content://") -> rc.contentResolver.openInputStream(Uri.parse(src))
              src.startsWith("file://") -> File(Uri.parse(src).path ?: "").inputStream()
              else -> File(src).inputStream()
            } ?: throw IOException("Fichier source illisible")
        input.use { i -> part.outputStream().use { o -> i.copyTo(o, 64 * 1024) } }
        if (dest.exists()) dest.delete()
        if (!part.renameTo(dest)) throw IOException("Copie impossible")
        promise.resolve(dest.length().toDouble())
      } catch (e: Exception) {
        if (part.exists()) part.delete()
        promise.reject("copy_failed", e.message ?: "Copie impossible", e)
      }
    }
  }

  private fun doDownload(
      id: String,
      url: String,
      destPath: String,
      headers: ReadableMap?,
      maxBytes: Long,
  ): WritableMap {
    val dest = File(destPath)
    val part = File("$destPath.part")
    var conn: HttpURLConnection? = null
    try {
      dest.parentFile?.mkdirs()
      val c = URL(url).openConnection() as HttpURLConnection
      conn = c
      c.connectTimeout = 20_000
      c.readTimeout = 30_000
      c.instanceFollowRedirects = false
      c.requestMethod = "GET"
      if (headers != null) {
        val keys = headers.keySetIterator()
        while (keys.hasNextKey()) {
          val k = keys.nextKey()
          headers.getString(k)?.let { v -> c.setRequestProperty(k, v) }
        }
      }

      val status = c.responseCode
      if (status == 413) throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
      if (status !in 200..299) throw DownloadException("http_$status", "Erreur HTTP $status")

      val total = c.contentLengthLong.coerceAtLeast(0L)
      if (total > maxBytes) throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
      val mime = c.contentType ?: ""
      val compressed = !c.contentEncoding.isNullOrEmpty()

      var received = 0L
      var lastEmit = 0L
      try {
        c.inputStream.use { input ->
          part.outputStream().buffered(64 * 1024).use { out ->
            val buf = ByteArray(64 * 1024)
            while (true) {
              if (cancelled.contains(id)) throw DownloadException("cancelled", "Annulé")
              val n = input.read(buf)
              if (n < 0) break
              received += n
              if (received > maxBytes) {
                throw DownloadException("PAYLOAD_TOO_LARGE", "Fichier trop volumineux")
              }
              out.write(buf, 0, n)
              val now = System.currentTimeMillis()
              if (now - lastEmit >= 100) {
                lastEmit = now
                emitProgress(id, received, total)
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
      emitProgress(id, received, total)

      if (dest.exists()) dest.delete()
      if (!part.renameTo(dest)) {
        throw DownloadException("storage_full", "Impossible d'enregistrer le fichier")
      }
      val map = Arguments.createMap()
      map.putString("path", dest.absolutePath)
      map.putDouble("size", received.toDouble())
      map.putString("mime", mime)
      return map
    } finally {
      conn?.disconnect()
      if (part.exists()) part.delete()
    }
  }

  private fun emitProgress(id: String, received: Long, total: Long) {
    if (!rc.hasActiveReactInstance()) return
    val map = Arguments.createMap()
    map.putString("id", id)
    map.putDouble("received", received.toDouble())
    map.putDouble("total", total.toDouble())
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("botgramDownloadProgress", map)
  }

  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  override fun invalidate() {
    executor.shutdownNow()
    super.invalidate()
  }
}
