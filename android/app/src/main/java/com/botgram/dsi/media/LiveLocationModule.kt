package com.botgram.dsi.media

import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * JS : NativeModules.BotgramLiveLocation
 *   start(title, text, stopLabel) -> void  (démarre le service + notification)
 *   stop() -> void
 *   isRunning() -> boolean
 * Événements : BotgramLiveLocationUpdate {latitude, longitude, accuracy, heading},
 *              BotgramLiveLocationStop (bouton « Arrêter » de la notification).
 */
class LiveLocationModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc) {

  init {
    LiveLocationService.sink = { name, data -> emit(name, data) }
  }

  override fun getName(): String = "BotgramLiveLocation"

  private fun emit(name: String, data: WritableMap?) {
    if (!rc.hasActiveReactInstance()) return
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(name, data)
  }

  @ReactMethod
  fun start(title: String, text: String, stopLabel: String, promise: Promise) {
    try {
      val i =
          Intent(rc, LiveLocationService::class.java)
              .putExtra(LiveLocationService.EXTRA_TITLE, title)
              .putExtra(LiveLocationService.EXTRA_TEXT, text)
              .putExtra(LiveLocationService.EXTRA_STOP_LABEL, stopLabel)
      ContextCompat.startForegroundService(rc, i)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("start_failed", e.message, e)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      rc.stopService(Intent(rc, LiveLocationService::class.java))
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("stop_failed", e.message, e)
    }
  }

  @ReactMethod
  fun isRunning(promise: Promise) {
    promise.resolve(LiveLocationService.running)
  }

  // Requis par NativeEventEmitter.
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}
}
