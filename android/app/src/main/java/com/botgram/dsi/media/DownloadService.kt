package com.botgram.dsi.media

import android.app.Notification
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.content.ContextCompat

/**
 * Service au premier plan qui garde le processus en vie pendant les téléchargements et affiche
 * UNE notification par fichier (barre + pourcentage). Il ne télécharge rien lui-même : il
 * affiche l'état de [DownloadEngine].
 *
 * Une des notifications (la « tête ») est celle du service ; quand elle se termine, le service
 * la détache (elle devient une notification normale, écartable) et passe au téléchargement suivant.
 * Tout se passe sur le thread principal.
 */
class DownloadService : Service() {

  companion object {
    const val ACTION_CANCEL = "com.botgram.dsi.media.CANCEL_DOWNLOAD"
    const val EXTRA_ID = "id"

    @Volatile private var instance: DownloadService? = null
    private val main = Handler(Looper.getMainLooper())

    /** Un téléchargement mérite maintenant une notification : démarre le service si besoin. */
    fun ensureStarted(ctx: Context, job: DownloadJob) {
      val running = instance
      if (running != null) {
        main.post { running.update(job) }
        return
      }
      try {
        ContextCompat.startForegroundService(ctx, Intent(ctx, DownloadService::class.java))
      } catch (_: Exception) {
        // Android refuse le service (app en arrière-plan strict) : le téléchargement continue,
        // simplement sans notification.
      }
    }

    fun onProgress(job: DownloadJob) {
      val running = instance ?: return
      main.post { running.update(job) }
    }

    fun onEnd(job: DownloadJob, errorCode: String?) {
      val running = instance ?: return
      main.post { running.end(job, errorCode) }
    }
  }

  private var leadId: String? = null

  private val nm: NotificationManager
    get() = getSystemService(NotificationManager::class.java)

  override fun onCreate() {
    super.onCreate()
    instance = this
    DownloadNotifier.ensureChannel(this)
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_CANCEL) {
      intent.getStringExtra(EXTRA_ID)?.let { DownloadEngine.cancel(it) }
      // Service relancé uniquement par le bouton (processus redémarré) : rien à garder.
      if (leadId == null && visibleJobs().isEmpty()) stopSelf()
      return START_NOT_STICKY
    }
    val jobs = visibleJobs()
    if (jobs.isEmpty()) {
      // Tout s'est terminé entre-temps. Android exige quand même une notification au démarrage.
      foreground(DownloadNotifier.IDLE_ID, DownloadNotifier.idle(this))
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }
    if (leadId == null) promote(jobs.first())
    jobs.forEach { update(it) }
    return START_NOT_STICKY
  }

  private fun visibleJobs(): List<DownloadJob> = DownloadEngine.activeJobs().filter { it.visible }

  private fun foreground(id: Int, n: Notification) {
    try {
      if (Build.VERSION.SDK_INT >= 29) {
        startForeground(id, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
      } else {
        startForeground(id, n)
      }
    } catch (_: Exception) {
      stopSelf()
    }
  }

  private fun promote(job: DownloadJob) {
    leadId = job.id
    job.shown = true
    foreground(DownloadNotifier.notificationId(job.id), DownloadNotifier.progress(this, job))
  }

  private fun post(id: Int, n: Notification) {
    try {
      nm.notify(id, n)
    } catch (_: Exception) {
      // notifications refusées par l'utilisateur : le téléchargement n'en dépend pas
    }
  }

  /** Met à jour (ou crée) la notification d'un téléchargement en cours. */
  private fun update(job: DownloadJob) {
    if (!job.visible || !DownloadEngine.isActive(job)) return
    if (leadId == null) {
      promote(job)
      return
    }
    job.shown = true
    post(DownloadNotifier.notificationId(job.id), DownloadNotifier.progress(this, job))
  }

  private fun end(job: DownloadJob, errorCode: String?) {
    val nid = DownloadNotifier.notificationId(job.id)
    if (job.id == leadId) {
      stopForeground(STOP_FOREGROUND_DETACH)
      leadId = null
    }
    when {
      !job.shown || errorCode == "cancelled" -> nm.cancel(nid)
      errorCode == null -> post(nid, DownloadNotifier.done(this, job))
      else -> post(nid, DownloadNotifier.failed(this, job, errorCode))
    }
    val next = visibleJobs().firstOrNull()
    if (next == null) {
      stopSelf()
    } else if (leadId == null) {
      promote(next)
    }
  }

  override fun onDestroy() {
    if (instance === this) instance = null
    super.onDestroy()
  }
}
