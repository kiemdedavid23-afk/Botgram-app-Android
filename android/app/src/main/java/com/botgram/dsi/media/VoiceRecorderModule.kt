package com.botgram.dsi.media

import android.Manifest
import android.content.pm.PackageManager
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File
import kotlin.math.sqrt

/**
 * Enregistrement d'un message vocal (micro) vers un fichier du cache.
 * Android 10+ : OGG/Opus (accepté comme message vocal) ; avant : M4A/AAC (envoyé comme audio).
 *
 * JS : NativeModules.BotgramVoiceRecorder
 *   start() -> {path, mime}                  rejette « permission_denied » · « busy » · « start_failed »
 *   stop()  -> {path, mime, size, durationMs} rejette « stop_failed » (enregistrement trop court/vide)
 *   cancel()                                  arrête et supprime le fichier
 * Événement : "botgramVoiceLevel" {level: 0..1, elapsedMs}  (~10 fois par seconde)
 */
class VoiceRecorderModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc) {

  private val main = Handler(Looper.getMainLooper())
  private var recorder: MediaRecorder? = null
  private var file: File? = null
  private var mime: String = "audio/ogg"
  private var startedAtMs = 0L

  override fun getName(): String = "BotgramVoiceRecorder"

  private val ticker =
      object : Runnable {
        override fun run() {
          val r = recorder ?: return
          val amp =
              try {
                r.maxAmplitude
              } catch (_: Exception) {
                0
              }
          val level = sqrt((amp / 32767.0).coerceIn(0.0, 1.0))
          val map = Arguments.createMap()
          map.putDouble("level", level)
          map.putDouble("elapsedMs", (System.currentTimeMillis() - startedAtMs).toDouble())
          emit("botgramVoiceLevel", map)
          main.postDelayed(this, 100)
        }
      }

  private fun emit(name: String, map: com.facebook.react.bridge.WritableMap) {
    if (!rc.hasActiveReactInstance()) return
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, map)
  }

  private fun voiceDir(): File =
      File(rc.cacheDir, "botgram-voice").also { if (!it.exists()) it.mkdirs() }

  /** Supprime les vieux enregistrements (> 24 h) pour ne pas encombrer le cache. */
  private fun purgeOld() {
    val limit = System.currentTimeMillis() - 24L * 60 * 60 * 1000
    voiceDir().listFiles()?.forEach { if (it.lastModified() < limit) it.delete() }
  }

  @ReactMethod
  fun start(promise: Promise) {
    main.post {
      if (recorder != null) {
        promise.reject("busy", "Un enregistrement est déjà en cours")
        return@post
      }
      if (ContextCompat.checkSelfPermission(rc, Manifest.permission.RECORD_AUDIO) !=
          PackageManager.PERMISSION_GRANTED) {
        promise.reject("permission_denied", "Micro non autorisé")
        return@post
      }
      var r: MediaRecorder? = null
      try {
        purgeOld()
        val ogg = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
        mime = if (ogg) "audio/ogg" else "audio/mp4"
        val ext = if (ogg) "ogg" else "m4a"
        val out = File(voiceDir(), "voice-${System.currentTimeMillis()}.$ext")
        r =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) MediaRecorder(rc)
            else @Suppress("DEPRECATION") MediaRecorder()
        r.setAudioSource(MediaRecorder.AudioSource.MIC)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          r.setOutputFormat(MediaRecorder.OutputFormat.OGG)
          r.setAudioEncoder(MediaRecorder.AudioEncoder.OPUS)
          r.setAudioSamplingRate(48000)
          r.setAudioEncodingBitRate(32000)
        } else {
          r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
          r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
          r.setAudioSamplingRate(44100)
          r.setAudioEncodingBitRate(64000)
        }
        r.setAudioChannels(1)
        r.setOutputFile(out.absolutePath)
        r.prepare()
        r.start()
        recorder = r
        file = out
        startedAtMs = System.currentTimeMillis()
        main.postDelayed(ticker, 100)
        val map = Arguments.createMap()
        map.putString("path", out.absolutePath)
        map.putString("mime", mime)
        promise.resolve(map)
      } catch (e: Exception) {
        try {
          r?.release()
        } catch (_: Exception) {}
        recorder = null
        file?.delete()
        file = null
        promise.reject("start_failed", e.message ?: "Enregistrement impossible", e)
      }
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    main.post {
      val r = recorder
      val out = file
      if (r == null || out == null) {
        promise.reject("stop_failed", "Aucun enregistrement en cours")
        return@post
      }
      main.removeCallbacks(ticker)
      recorder = null
      file = null
      val durationMs = System.currentTimeMillis() - startedAtMs
      try {
        r.stop()
        r.release()
        if (!out.exists() || out.length() == 0L) {
          promise.reject("stop_failed", "Enregistrement vide")
          return@post
        }
        val map = Arguments.createMap()
        map.putString("path", out.absolutePath)
        map.putString("mime", mime)
        map.putDouble("size", out.length().toDouble())
        map.putDouble("durationMs", durationMs.toDouble())
        promise.resolve(map)
      } catch (e: Exception) {
        // stop() échoue si l'enregistrement est trop court : on nettoie.
        try {
          r.release()
        } catch (_: Exception) {}
        out.delete()
        promise.reject("stop_failed", e.message ?: "Enregistrement trop court", e)
      }
    }
  }

  @ReactMethod
  fun cancel() {
    main.post { releaseAndDelete() }
  }

  private fun releaseAndDelete() {
    main.removeCallbacks(ticker)
    val r = recorder
    val out = file
    recorder = null
    file = null
    if (r != null) {
      try {
        r.stop()
      } catch (_: Exception) {}
      try {
        r.release()
      } catch (_: Exception) {}
    }
    out?.delete()
  }

  // Requis par NativeEventEmitter.
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  override fun invalidate() {
    // Rechargement JS : on coupe le micro.
    main.post { releaseAndDelete() }
    super.invalidate()
  }
}
