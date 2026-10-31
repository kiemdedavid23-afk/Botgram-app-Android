package com.botgram.dsi.media

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

/**
 * Mise à jour du canal « direct » : télécharge l'APK, vérifie taille + SHA-256 + nom de paquet,
 * puis le remet à l'installateur Android (l'utilisateur confirme).
 *
 * JS : NativeModules.BotgramAppUpdate
 *   canInstall() -> boolean                      (autorisation « applications inconnues »)
 *   openInstallSettings() -> void
 *   download(url, sha256, size) -> chemin        rejets : hash_missing, bad_url, busy, http_error,
 *                                                size_mismatch, hash_mismatch, wrong_package,
 *                                                cancelled, download_failed
 *   cancel(), install(), cleanup()
 * Événement : BotgramAppUpdateProgress {received, total}
 */
class AppUpdateModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  @Volatile private var cancelled = false
  @Volatile private var downloading = false

  override fun getName(): String = "BotgramAppUpdate"

  private fun updatesDir(): File = File(rc.cacheDir, "updates")

  private fun apkFile(): File = File(updatesDir(), "botgram-update.apk")

  @ReactMethod
  fun canInstall(promise: Promise) {
    promise.resolve(
        Build.VERSION.SDK_INT < Build.VERSION_CODES.O || rc.packageManager.canRequestPackageInstalls())
  }

  @ReactMethod
  fun openInstallSettings(promise: Promise) {
    try {
      val i =
          Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${rc.packageName}"))
              .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      rc.startActivity(i)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("settings_failed", e.message, e)
    }
  }

  @ReactMethod
  fun download(url: String, sha256: String, size: Double, promise: Promise) {
    if (!url.startsWith("https://")) {
      promise.reject("bad_url", "Seul HTTPS est accepté")
      return
    }
    if (sha256.isBlank()) {
      promise.reject("hash_missing", "Empreinte SHA-256 absente")
      return
    }
    if (downloading) {
      promise.reject("busy", "Téléchargement déjà en cours")
      return
    }
    downloading = true
    cancelled = false
    Thread {
          val dir = updatesDir()
          val part = File(dir, "download.part")
          try {
            dir.mkdirs()
            dir.listFiles()?.forEach { it.delete() }
            val conn = URL(url).openConnection() as HttpURLConnection
            conn.connectTimeout = 15_000
            conn.readTimeout = 30_000
            conn.instanceFollowRedirects = true
            conn.connect()
            if (conn.responseCode !in 200..299) {
              promise.reject("http_error", "HTTP ${conn.responseCode}")
              return@Thread
            }
            val total = if (conn.contentLengthLong > 0) conn.contentLengthLong else size.toLong()
            val md = MessageDigest.getInstance("SHA-256")
            var received = 0L
            var lastEmit = 0L
            conn.inputStream.use { input ->
              part.outputStream().use { out ->
                val buf = ByteArray(64 * 1024)
                while (true) {
                  if (cancelled) throw CancelledException()
                  val n = input.read(buf)
                  if (n < 0) break
                  out.write(buf, 0, n)
                  md.update(buf, 0, n)
                  received += n
                  val now = System.currentTimeMillis()
                  if (now - lastEmit > 250) {
                    lastEmit = now
                    emitProgress(received, total)
                  }
                }
              }
            }
            emitProgress(received, total)
            if (size > 0 && part.length() != size.toLong()) {
              part.delete()
              promise.reject("size_mismatch", "Taille inattendue")
              return@Thread
            }
            val hex = md.digest().joinToString("") { "%02x".format(it) }
            if (!hex.equals(sha256.trim(), ignoreCase = true)) {
              part.delete()
              promise.reject("hash_mismatch", "Empreinte SHA-256 différente")
              return@Thread
            }
            val out = apkFile()
            if (!part.renameTo(out)) {
              promise.reject("download_failed", "Écriture impossible")
              return@Thread
            }
            val info = rc.packageManager.getPackageArchiveInfo(out.absolutePath, 0)
            if (info == null || info.packageName != rc.packageName) {
              out.delete()
              promise.reject("wrong_package", "Ce fichier n'est pas une mise à jour de Botgram")
              return@Thread
            }
            promise.resolve(out.absolutePath)
          } catch (e: CancelledException) {
            part.delete()
            promise.reject("cancelled", "Annulé")
          } catch (e: Exception) {
            part.delete()
            promise.reject("download_failed", e.message, e)
          } finally {
            downloading = false
          }
        }
        .start()
  }

  private fun emitProgress(received: Long, total: Long) {
    if (!rc.hasActiveReactInstance()) return
    val m = Arguments.createMap()
    m.putDouble("received", received.toDouble())
    m.putDouble("total", total.toDouble())
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("BotgramAppUpdateProgress", m)
  }

  @ReactMethod
  fun cancel(promise: Promise) {
    cancelled = true
    promise.resolve(null)
  }

  @ReactMethod
  fun install(promise: Promise) {
    val f = apkFile()
    if (!f.exists()) {
      promise.reject("no_file", "Aucune mise à jour téléchargée")
      return
    }
    try {
      val uri = FileProvider.getUriForFile(rc, "${rc.packageName}.botgram.fileprovider", f)
      val i =
          Intent(Intent.ACTION_VIEW)
              .setDataAndType(uri, "application/vnd.android.package-archive")
              .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      rc.startActivity(i)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("install_failed", e.message, e)
    }
  }

  @ReactMethod
  fun cleanup(promise: Promise) {
    if (!downloading) updatesDir().listFiles()?.forEach { it.delete() }
    promise.resolve(null)
  }

  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  private class CancelledException : Exception()
}
