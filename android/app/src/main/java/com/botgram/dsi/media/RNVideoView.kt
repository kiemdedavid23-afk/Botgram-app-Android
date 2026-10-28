package com.botgram.dsi.media

import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event

/** Événement natif → JS (onLoad, onProgress, onPlayState, onEnd, onError, onFullscreen). */
class VideoEvent(
    surfaceId: Int,
    viewId: Int,
    private val name: String,
    private val data: WritableMap?,
) : Event<VideoEvent>(surfaceId, viewId) {
  override fun getEventName(): String = name

  override fun getEventData(): WritableMap? = data
}

/**
 * Vue vidéo native : ExoPlayer + PlayerView (barre de progression, lecture/pause, durée,
 * bouton plein écran). Le lecteur n'est créé que lorsqu'une source est fournie, et libéré
 * quand la vue est détruite : on ne garde jamais plusieurs décodeurs vidéo pour rien.
 */
@OptIn(UnstableApi::class)
class RNVideoView(private val rctx: ThemedReactContext) : FrameLayout(rctx) {

  // Props (appliquées d'un bloc par commit())
  var src: String? = null
  var startMs: Long = 0L
  var paused: Boolean = true
  var muted: Boolean = false
  var loop: Boolean = false
  var controls: Boolean = true
  var cover: Boolean = false

  private val main = Handler(Looper.getMainLooper())
  private val playerView: PlayerView
  private var player: ExoPlayer? = null
  private var loadedSrc: String? = null
  private var appliedPaused: Boolean? = null
  private var loadEmitted = false
  private var ticking = false

  private val ticker =
      object : Runnable {
        override fun run() {
          emitProgress()
          if (ticking) main.postDelayed(this, 250)
        }
      }

  private val playerListener =
      object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
          val p = player ?: return
          if (playbackState == Player.STATE_READY && !loadEmitted) {
            loadEmitted = true
            val map = Arguments.createMap()
            map.putDouble("durationMs", if (p.duration == C.TIME_UNSET) 0.0 else p.duration.toDouble())
            map.putInt("width", p.videoSize.width)
            map.putInt("height", p.videoSize.height)
            emit("topVideoLoad", map)
          }
          if (playbackState == Player.STATE_ENDED) {
            emitProgress()
            emit("topVideoEnd", Arguments.createMap())
          }
          emitPlayState()
        }

        override fun onIsPlayingChanged(isPlaying: Boolean) {
          if (isPlaying) {
            player?.let { PlaybackCoordinator.onVideoWillPlay(it) }
            startTicker()
          } else {
            stopTicker()
            emitProgress()
          }
          emitPlayState()
        }

        override fun onPlayerError(error: PlaybackException) {
          val map = Arguments.createMap()
          map.putString("code", error.errorCodeName)
          map.putString("message", error.message ?: "Erreur de lecture")
          emit("topVideoError", map)
        }
      }

  // Déclaré AVANT init : addView() appelle requestLayout().
  private val measureAndLayout = Runnable {
    measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
    )
    layout(left, top, right, bottom)
  }

  init {
    setBackgroundColor(Color.BLACK)
    playerView =
        PlayerView(rctx).apply {
          layoutParams =
              LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
          setShowNextButton(false)
          setShowPreviousButton(false)
          setShowSubtitleButton(false)
          controllerShowTimeoutMs = 2500
          setBackgroundColor(Color.BLACK)
          setFullscreenButtonClickListener { isFullscreen ->
            val map = Arguments.createMap()
            map.putBoolean("fullscreen", isFullscreen)
            emit("topVideoFullscreen", map)
          }
        }
    addView(playerView)
  }

  // React Native ne relance pas le layout des enfants natifs : on le force.
  override fun requestLayout() {
    super.requestLayout()
    post(measureAndLayout)
  }

  private fun emit(name: String, data: WritableMap?) {
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(rctx, id) ?: return
    dispatcher.dispatchEvent(VideoEvent(UIManagerHelper.getSurfaceId(rctx), id, name, data))
  }

  private fun emitPlayState() {
    val p = player ?: return
    val map = Arguments.createMap()
    map.putBoolean("playing", p.isPlaying)
    map.putBoolean("buffering", p.playbackState == Player.STATE_BUFFERING)
    map.putBoolean("ended", p.playbackState == Player.STATE_ENDED)
    emit("topVideoState", map)
  }

  private fun emitProgress() {
    val p = player ?: return
    val map = Arguments.createMap()
    map.putDouble("positionMs", p.currentPosition.coerceAtLeast(0L).toDouble())
    map.putDouble("durationMs", if (p.duration == C.TIME_UNSET) 0.0 else p.duration.toDouble())
    emit("topVideoProgress", map)
  }

  private fun startTicker() {
    if (ticking) return
    ticking = true
    main.postDelayed(ticker, 250)
  }

  private fun stopTicker() {
    ticking = false
    main.removeCallbacks(ticker)
  }

  private fun ensurePlayer(): ExoPlayer {
    player?.let { return it }
    val p = PlaybackCoordinator.newVideoPlayer(rctx)
    p.addListener(playerListener)
    playerView.player = p
    player = p
    return p
  }

  /** Applique les props reçues (appelé une fois par transaction de props). */
  fun commit() {
    val path = src
    if (path.isNullOrEmpty()) {
      release()
      return
    }
    val p = ensurePlayer()
    if (loadedSrc != path) {
      loadedSrc = path
      loadEmitted = false
      appliedPaused = null
      p.setMediaItem(MediaItem.fromUri(PlaybackCoordinator.toUri(path)), startMs)
      p.prepare()
    }
    p.volume = if (muted) 0f else 1f
    p.repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    playerView.useController = controls
    playerView.resizeMode =
        if (cover) AspectRatioFrameLayout.RESIZE_MODE_ZOOM else AspectRatioFrameLayout.RESIZE_MODE_FIT
    // N'agit sur lecture/pause que si la prop `paused` a changé (l'utilisateur peut avoir
    // utilisé les contrôles natifs entre-temps).
    if (appliedPaused != paused) {
      appliedPaused = paused
      if (paused) {
        p.pause()
      } else {
        PlaybackCoordinator.onVideoWillPlay(p)
        p.play()
      }
    }
  }

  fun seekTo(ms: Long) {
    player?.seekTo(ms.coerceAtLeast(0L))
  }

  fun play() {
    player?.let {
      appliedPaused = false
      PlaybackCoordinator.onVideoWillPlay(it)
      if (it.playbackState == Player.STATE_ENDED) it.seekTo(0)
      it.play()
    }
  }

  fun pause() {
    appliedPaused = true
    player?.pause()
  }

  override fun onDetachedFromWindow() {
    // Sorti de l'écran (liste recyclée, navigation) : on coupe le son.
    player?.pause()
    stopTicker()
    super.onDetachedFromWindow()
  }

  fun release() {
    stopTicker()
    main.removeCallbacks(measureAndLayout)
    player?.let {
      it.removeListener(playerListener)
      playerView.player = null
      PlaybackCoordinator.releaseVideo(it)
      it.release()
    }
    player = null
    loadedSrc = null
    appliedPaused = null
    loadEmitted = false
  }
}
