package com.botgram.dsi.media

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * JS : requireNativeComponent("BotgramCameraView")
 * Props : active (bool) · front (bool, caméra frontale) · flash ("off" | "on" | "auto")
 * Ne monter / activer l'aperçu que si la permission CAMERA est accordée.
 */
class CameraViewManager : SimpleViewManager<RNCameraView>() {

  override fun getName(): String = "BotgramCameraView"

  override fun createViewInstance(context: ThemedReactContext): RNCameraView = RNCameraView(context)

  @ReactProp(name = "active", defaultBoolean = false)
  fun setActive(view: RNCameraView, active: Boolean) {
    view.active = active
  }

  @ReactProp(name = "front", defaultBoolean = false)
  fun setFront(view: RNCameraView, front: Boolean) {
    view.front = front
  }

  @ReactProp(name = "flash")
  fun setFlash(view: RNCameraView, flash: String?) {
    view.flash = flash ?: "off"
  }

  override fun onAfterUpdateTransaction(view: RNCameraView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  override fun onDropViewInstance(view: RNCameraView) {
    view.release()
    super.onDropViewInstance(view)
  }
}
