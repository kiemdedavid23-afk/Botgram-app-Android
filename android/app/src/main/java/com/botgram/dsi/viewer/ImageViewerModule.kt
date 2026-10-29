package com.botgram.dsi.viewer

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Pont JS de la visionneuse d'images.
 *
 * JS : NativeModules.BotgramImageViewer.open(itemsJson, index)
 *   itemsJson = '[{"uri": "file:///…", "title": "légende facultative"}, …]'
 */
class ImageViewerModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  override fun getName(): String = "BotgramImageViewer"

  @ReactMethod
  fun open(itemsJson: String, index: Int) {
    val intent =
        Intent(rc, ImageViewerActivity::class.java)
            .putExtra(ImageViewerActivity.EXTRA_ITEMS, itemsJson)
            .putExtra(ImageViewerActivity.EXTRA_INDEX, index)
    val activity = rc.currentActivity
    if (activity != null) {
      activity.startActivity(intent)
    } else {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      rc.startActivity(intent)
    }
  }
}
