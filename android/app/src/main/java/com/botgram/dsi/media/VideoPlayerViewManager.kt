package com.botgram.dsi.media

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * JS : requireNativeComponent("BotgramVideoView")
 * Props : src (chemin local) · paused · muted · loop · controls · resizeMode("contain"|"cover") · startMs
 * Événements : onLoad · onProgress · onPlayState · onEnd · onError · onFullscreen
 * Commandes : seekTo(ms) · play() · pause()
 */
@OptIn(UnstableApi::class)
class VideoPlayerViewManager : SimpleViewManager<RNVideoView>() {

  override fun getName(): String = "BotgramVideoView"

  override fun createViewInstance(context: ThemedReactContext): RNVideoView = RNVideoView(context)

  @ReactProp(name = "src")
  fun setSrc(view: RNVideoView, src: String?) {
    view.src = src
  }

  @ReactProp(name = "startMs", defaultDouble = 0.0)
  fun setStartMs(view: RNVideoView, startMs: Double) {
    view.startMs = startMs.toLong().coerceAtLeast(0L)
  }

  @ReactProp(name = "paused", defaultBoolean = true)
  fun setPaused(view: RNVideoView, paused: Boolean) {
    view.paused = paused
  }

  @ReactProp(name = "muted", defaultBoolean = false)
  fun setMuted(view: RNVideoView, muted: Boolean) {
    view.muted = muted
  }

  @ReactProp(name = "loop", defaultBoolean = false)
  fun setLoop(view: RNVideoView, loop: Boolean) {
    view.loop = loop
  }

  @ReactProp(name = "controls", defaultBoolean = true)
  fun setControls(view: RNVideoView, controls: Boolean) {
    view.controls = controls
  }

  @ReactProp(name = "resizeMode")
  fun setResizeMode(view: RNVideoView, mode: String?) {
    view.cover = mode == "cover"
  }

  override fun onAfterUpdateTransaction(view: RNVideoView) {
    super.onAfterUpdateTransaction(view)
    view.commit()
  }

  override fun receiveCommand(root: RNVideoView, commandId: String, args: ReadableArray?) {
    when (commandId) {
      "seekTo" -> root.seekTo(args?.getDouble(0)?.toLong() ?: 0L)
      "play" -> root.play()
      "pause" -> root.pause()
    }
  }

  override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any> =
      mapOf(
          "topVideoLoad" to mapOf("registrationName" to "onLoad"),
          "topVideoProgress" to mapOf("registrationName" to "onProgress"),
          "topVideoState" to mapOf("registrationName" to "onPlayState"),
          "topVideoEnd" to mapOf("registrationName" to "onEnd"),
          "topVideoError" to mapOf("registrationName" to "onError"),
          "topVideoFullscreen" to mapOf("registrationName" to "onFullscreen"),
      )

  override fun onDropViewInstance(view: RNVideoView) {
    view.release()
    super.onDropViewInstance(view)
  }
}
