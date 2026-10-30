package com.botgram.dsi.media

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * JS : NativeModules.BotgramCamera
 *   takePhoto() -> {uri: "file://…", name, mime, size}
 *   rejette « camera_not_ready » (aucun aperçu actif) ou « capture_failed ».
 */
class CameraModule(rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  override fun getName(): String = "BotgramCamera"

  @ReactMethod
  fun takePhoto(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val view = RNCameraView.current?.get()
      if (view == null) {
        promise.reject("camera_not_ready", "Aucun aperçu caméra actif")
      } else {
        view.takePhoto(promise)
      }
    }
  }
}
