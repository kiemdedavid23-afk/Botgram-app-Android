package com.botgram.dsi.media

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import java.io.File

/**
 * Point central de la lecture média (thread principal uniquement).
 *
 * - UN seul ExoPlayer audio, partagé entre le service (notification / écran verrouillé)
 *   et le module JS : c'est lui qui joue les vocaux et les audios.
 * - Les vidéos ont chacune leur propre ExoPlayer (créé seulement quand l'utilisateur lance
 *   la lecture), mais une seule peut jouer à la fois, et jamais en même temps que l'audio.
 */
@OptIn(UnstableApi::class)
object PlaybackCoordinator {

  private var audio: ExoPlayer? = null
  private val videos = LinkedHashSet<ExoPlayer>()

  /** Lecteur audio partagé. À appeler depuis le thread principal. */
  fun audioPlayer(context: Context): ExoPlayer {
    audio?.let { return it }
    val player =
        ExoPlayer.Builder(context.applicationContext)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
                    .build(),
                /* handleAudioFocus = */ true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()
    audio = player
    return player
  }

  /** Nouveau lecteur pour une vue vidéo. */
  fun newVideoPlayer(context: Context): ExoPlayer {
    val player =
        ExoPlayer.Builder(context.applicationContext)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA)
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .build(),
                true,
            )
            .setHandleAudioBecomingNoisy(true)
            .build()
    videos.add(player)
    return player
  }

  fun releaseVideo(player: ExoPlayer) {
    videos.remove(player)
  }

  /** Une vidéo va jouer : on coupe l'audio et les autres vidéos. */
  fun onVideoWillPlay(player: ExoPlayer) {
    audio?.let { if (it.isPlaying || it.playWhenReady) it.pause() }
    for (v in videos) {
      if (v !== player && (v.isPlaying || v.playWhenReady)) v.pause()
    }
  }

  /** L'audio va jouer : on coupe toutes les vidéos. */
  fun onAudioWillPlay() {
    for (v in videos) {
      if (v.isPlaying || v.playWhenReady) v.pause()
    }
  }

  /** `file://…` ou chemin absolu → Uri. */
  fun toUri(path: String): Uri =
      if (path.contains("://")) Uri.parse(path) else Uri.fromFile(File(path))
}
