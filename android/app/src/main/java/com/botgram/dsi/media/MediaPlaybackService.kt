package com.botgram.dsi.media

import android.app.PendingIntent
import android.content.Intent
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.botgram.dsi.MainActivity

/**
 * Service de lecture audio : notification média, écran verrouillé, boutons du casque / Bluetooth,
 * lecture en arrière-plan. Il enveloppe le lecteur audio partagé de [PlaybackCoordinator].
 * Media3 démarre le service au premier « play » et affiche la notification tout seul.
 */
@OptIn(UnstableApi::class)
class MediaPlaybackService : MediaSessionService() {

  private var session: MediaSession? = null

  override fun onCreate() {
    super.onCreate()
    val player = PlaybackCoordinator.audioPlayer(this)
    val openApp =
        PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    session = MediaSession.Builder(this, player).setSessionActivity(openApp).build()
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
