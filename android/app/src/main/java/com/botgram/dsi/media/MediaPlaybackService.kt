package com.botgram.dsi.media

import android.app.PendingIntent
import android.content.Intent
import androidx.annotation.OptIn
import androidx.media3.common.ForwardingPlayer
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.DefaultMediaNotificationProvider
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.botgram.dsi.MainActivity
import com.botgram.dsi.R

/**
 * Service de lecture audio : notification média, écran verrouillé, boutons du casque / Bluetooth,
 * lecture en arrière-plan. Il enveloppe le lecteur audio partagé de [PlaybackCoordinator].
 * Media3 démarre le service au premier « play » et affiche la notification tout seul.
 *
 * Présentation de la notification :
 *  - icône de statut Botgram (avion + robot) à la place de l'icône générique,
 *  - pochette = icône ronde de l'app quand le message n'en a pas,
 *  - titre = nom du fichier (ou « Message vocal »), sous-titre = « Botgram » par défaut,
 *  - canal « Lecture audio » (nom lisible dans les réglages Android).
 */
@OptIn(UnstableApi::class)
class MediaPlaybackService : MediaSessionService() {

  private var session: MediaSession? = null

  override fun onCreate() {
    super.onCreate()

    val provider =
        DefaultMediaNotificationProvider.Builder(this)
            .setChannelId("botgram_playback")
            .setChannelName(R.string.notif_channel_playback)
            .build()
    provider.setSmallIcon(R.drawable.ic_stat_botgram)
    setMediaNotificationProvider(provider)

    val base = PlaybackCoordinator.audioPlayer(this)
    val player =
        object : ForwardingPlayer(base) {
          override fun getMediaMetadata(): MediaMetadata = decorate(super.getMediaMetadata())
        }
    val openApp =
        PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    session = MediaSession.Builder(this, player).setSessionActivity(openApp).build()
  }

  /** Complète les métadonnées manquantes pour que la notification soit toujours bien remplie. */
  private fun decorate(md: MediaMetadata): MediaMetadata {
    val b = md.buildUpon()
    if (md.title.isNullOrBlank()) b.setTitle(getString(R.string.notif_audio_default_title))
    if (md.artist.isNullOrBlank()) b.setArtist(getString(R.string.app_name))
    if (md.artworkData == null && md.artworkUri == null) {
      PlaybackArt.pngBytes(this)?.let { b.setArtworkData(it, MediaMetadata.PICTURE_TYPE_FRONT_COVER) }
    }
    return b.build()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

  override fun onTaskRemoved(rootIntent: Intent?) {
    // App balayée des tâches récentes : on arrête la lecture au lieu de laisser un service orphelin.
    val player = session?.player
    if (player != null && player.playWhenReady) player.pause()
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    // Le lecteur reste vivant (partagé) ; seule la session est libérée.
    session?.release()
    session = null
    super.onDestroy()
  }
}
