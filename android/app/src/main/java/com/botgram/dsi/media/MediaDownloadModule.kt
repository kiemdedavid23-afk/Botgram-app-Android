package com.botgram.dsi.media

import android.net.Uri
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.io.IOException
import java.util.concurrent.Executors

/**
 * Pont JS du téléchargement natif. Le travail est fait par [DownloadEngine] (qui survit au
 * rechargement du JS) et la notification par [DownloadService].
 *
 * JS : NativeModules.BotgramDownload
 *   describe(id, label, kind)                      nom et type affichés dans la notification
 *   download(id, url, destPath, headers, maxBytes) -> Promise<{path, size, mime}>
 *   cancel(id)
 *   copyLocal(src, destPath) -> Promise<size>
 * Événement : "botgramDownloadProgress" {id, received, total}  (total = 0 si inconnu)
 *
 * Codes de rejet : http_<status> · PAYLOAD_TOO_LARGE · network_error · storage_full · cancelled
 */
class MediaDownloadModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc) {

  private val copyExecutor = Executors.newFixedThreadPool(2)

  override fun getName(): String = "BotgramDownload"

  @ReactMethod
  fun describe(id: String, label: String?, kind: String?) {
    DownloadEngine.describe(id, label ?: "", kind ?: "")
  }

  @ReactMethod
  fun download(
      id: String,
      url: String,
      destPath: String,
      headers: ReadableMap?,
      maxBytes: Double,
      promise: Promise,
  ) {
    val map = HashMap<String, String>()
    if (headers != null) {
      val keys = headers.keySetIterator()
      while (keys.hasNextKey()) {
        val k = keys.nextKey()
        headers.getString(k)?.let { v -> map[k] = v }
      }
    }
    DownloadEngine.start(
        rc.applicationContext,
        DownloadRequest(id, url, destPath, map, maxBytes.toLong()),
        object : DownloadCallback {
          override fun onProgress(received: Long, total: Long) = emitProgress(id, received, total)

          override fun onSuccess(path: String, size: Long, mime: String) {
            val r = Arguments.createMap()
            r.putString("path", path)
            r.putDouble("size", size.toDouble())
            r.putString("mime", mime)
            promise.resolve(r)
          }

          override fun onError(code: String, message: String) {
            promise.reject(code, message)
          }
        })
  }

  @ReactMethod
  fun cancel(id: String) {
    DownloadEngine.cancel(id)
  }

  /**
   * Copie un fichier local (content:// du sélecteur, file:// ou chemin) vers `destPath`.
   * Sert à garder sur le téléphone les médias qu'on envoie : on peut les lire sans le Worker.
   * Résout avec la taille copiée.
   */
  @ReactMethod
  fun copyLocal(src: String, destPath: String, promise: Promise) {
    copyExecutor.execute {
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
    // Les téléchargements en cours continuent (moteur indépendant) ; seules les copies s'arrêtent.
    copyExecutor.shutdownNow()
    super.invalidate()
  }
}
