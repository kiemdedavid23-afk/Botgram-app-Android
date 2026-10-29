package com.botgram.dsi.media

import com.botgram.dsi.viewer.ImageViewerModule
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** Modules médias natifs : téléchargement, audio, miniatures/forme d'onde, vue vidéo, visionneuse d'images. */
class MediaPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
      listOf(
          MediaDownloadModule(reactContext),
          AudioPlayerModule(reactContext),
          MediaToolsModule(reactContext),
          ImageViewerModule(reactContext),
      )

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
      listOf(VideoPlayerViewManager())
}
