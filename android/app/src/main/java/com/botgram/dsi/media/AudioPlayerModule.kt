package com.botgram.dsi.media

import android.content.ComponentName
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.common.util.concurrent.ListenableFuture

/**
 * Moteur audio (vocaux + audios).
 *
 * JS : NativeModules.BotgramAudio
 *   playQueue(items, startIndex, startPositionMs) · pause() · resume() · stop()
 *   seekTo(ms) · setSpeed(1 | 1.5 | 2) · getState() -> Promise<State>
 * Événements : "botgramAudioState" (State), "botgramAudioError" {id, code, message}
 *
 * State : { id, index, state: "idle"|"buffering"|"playing"|"paused"|"ended",
 *           positionMs, durationMs, speed }
 */
@OptIn(UnstableApi::class)
class AudioPlayerModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc) {

  private val main = Handler(Looper.getMainLooper())
  private var player: ExoPlayer? = null
  private var listenerAttached = false
  private var controller: ListenableFuture<MediaController>? = null
  private var ticking = false

  override fun getName(): String = "BotgramAudio"

  private val ticker =
      object : Runnable {
        override fun run() {
          emitState()
          if (ticking) main.postDelayed(this, 250)
        }
      }

  private val listener =
      object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) = emitState()

        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) = emitState()

        override fun onIsPlayingChanged(isPlaying: Boolean) {
          if (isPlaying) {
            PlaybackCoordinator.onAudioWillPlay()
            startTicker()
          } else {
            stopTicker()
          }
          emitState()
        }

        override fun onPlayerError(error: PlaybackException) {
          val map = Arguments.createMap()
          map.putString("id", player?.currentMediaItem?.mediaId)
          map.putString("code", error.errorCodeName)
          map.putString("message", error.message ?: "Erreur de lecture")
          emit("botgramAudioError", map)
          emitState()
        }
      }

  /** Thread principal uniquement. */
  private fun ensurePlayer(): ExoPlayer {
    val p = PlaybackCoordinator.audioPlayer(rc.applicationContext)
    player = p
    if (!listenerAttached) {
      p.addListener(listener)
      listenerAttached = true
    }
    if (controller == null) {
      // Une connexion MediaController maintient le service (notification) lié à l'app.
      val ctx = rc.applicationContext
      val token = SessionToken(ctx, ComponentName(ctx, MediaPlaybackService::class.java))
      controller = MediaController.Builder(ctx, token).buildAsync()
    }
    return p
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

  private fun stateMap(p: ExoPlayer): WritableMap {
    val map = Arguments.createMap()
    val state =
        when (p.playbackState) {
          Player.STATE_IDLE -> "idle"
          Player.STATE_BUFFERING -> "buffering"
          Player.STATE_ENDED -> "ended"
          else -> if (p.playWhenReady) "playing" else "paused"
        }
    val duration = p.duration
    map.putString("id", p.currentMediaItem?.mediaId)
    map.putInt("index", p.currentMediaItemIndex)
    map.putString("state", state)
    map.putDouble("positionMs", p.currentPosition.coerceAtLeast(0L).toDouble())
    map.putDouble("durationMs", if (duration == C.TIME_UNSET) 0.0 else duration.toDouble())
    map.putDouble("speed", p.playbackParameters.speed.toDouble())
    return map
  }

  private fun emitState() {
    val p = player ?: return
    emit("botgramAudioState", stateMap(p))
  }

  private fun emit(event: String, data: WritableMap) {
    if (!rc.hasActiveReactInstance()) return
    rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(event, data)
  }

  /**
   * items : [{ id, path, title?, subtitle? }] — `path` = fichier local déjà téléchargé.
   * Les éléments s'enchaînent automatiquement (vocaux à la suite).
   */
  @ReactMethod
  fun playQueue(items: ReadableArray, startIndex: Int, startPositionMs: Double) {
    val list = ArrayList<MediaItem>(items.size())
    for (i in 0 until items.size()) {
      val it = items.getMap(i) ?: continue
      val id = it.getString("id") ?: continue
      val path = it.getString("path") ?: continue
      val meta =
          MediaMetadata.Builder()
              .setTitle(if (it.hasKey("title")) it.getString("title") else null)
              .setArtist(if (it.hasKey("subtitle")) it.getString("subtitle") else null)
              .build()
      list.add(
          MediaItem.Builder()
              .setMediaId(id)
              .setUri(PlaybackCoordinator.toUri(path))
              .setMediaMetadata(meta)
              .build())
    }
    if (list.isEmpty()) return
    UiThreadUtil.runOnUiThread {
      val p = ensurePlayer()
      PlaybackCoordinator.onAudioWillPlay()
      p.setMediaItems(list, startIndex.coerceIn(0, list.size - 1), startPositionMs.toLong())
      p.prepare()
      p.play()
    }
  }

  @ReactMethod
  fun resume() {
    UiThreadUtil.runOnUiThread {
      val p = ensurePlayer()
      if (p.playbackState == Player.STATE_ENDED) p.seekTo(0)
      PlaybackCoordinator.onAudioWillPlay()
      p.play()
    }
  }

  @ReactMethod
  fun pause() {
    UiThreadUtil.runOnUiThread { player?.pause() }
  }

  @ReactMethod
  fun stop() {
    UiThreadUtil.runOnUiThread {
      player?.let {
        it.stop()
        it.clearMediaItems()
      }
      stopTicker()
      emitState()
    }
  }

  @ReactMethod
  fun seekTo(positionMs: Double) {
    UiThreadUtil.runOnUiThread { player?.seekTo(positionMs.toLong().coerceAtLeast(0L)) }
  }

  @ReactMethod
  fun setSpeed(speed: Double) {
    UiThreadUtil.runOnUiThread {
      ensurePlayer().setPlaybackSpeed(speed.toFloat().coerceIn(0.5f, 3f))
      emitState()
    }
  }

  @ReactMethod
  fun getState(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val p = player
      if (p == null) {
        val map = Arguments.createMap()
        map.putString("state", "idle")
        map.putNull("id")
        map.putInt("index", 0)
        map.putDouble("positionMs", 0.0)
        map.putDouble("durationMs", 0.0)
        map.putDouble("speed", 1.0)
        promise.resolve(map)
      } else {
        promise.resolve(stateMap(p))
      }
    }
  }

  // Requis par NativeEventEmitter.
  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Int) {}

  override fun invalidate() {
    // Rechargement JS : on coupe le son et on libère notre branchement (le lecteur partagé survit).
    main.post {
      stopTicker()
      player?.let {
        if (listenerAttached) it.removeListener(listener)
        it.pause()
      }
      listenerAttached = false
      controller?.let { MediaController.releaseFuture(it) }
      controller = null
    }
    super.invalidate()
  }
}
