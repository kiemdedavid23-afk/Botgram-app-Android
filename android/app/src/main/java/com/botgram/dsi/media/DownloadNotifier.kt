package com.botgram.dsi.media

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.text.format.Formatter
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.botgram.dsi.MainActivity
import com.botgram.dsi.R

/**
 * Fabrique les notifications de téléchargement : icône Botgram, nom du fichier, type,
 * barre de progression, pourcentage et taille, bouton « Annuler ».
 * Tout le texte vient de strings.xml.
 */
object DownloadNotifier {

  const val CHANNEL_ID = "botgram_downloads"
  const val IDLE_ID = 19_999

  fun ensureChannel(ctx: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = ctx.getSystemService(NotificationManager::class.java) ?: return
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    val ch =
        NotificationChannel(
            CHANNEL_ID,
            ctx.getString(R.string.notif_channel_downloads),
            NotificationManager.IMPORTANCE_LOW,
        )
    ch.description = ctx.getString(R.string.notif_channel_downloads_desc)
    ch.setShowBadge(false)
    nm.createNotificationChannel(ch)
  }

  /** Identifiant de notification stable pour un job (plage 20 000 – 119 999). */
  fun notificationId(jobId: String): Int = 20_000 + (jobId.hashCode() and 0x7FFFFFFF) % 100_000

  private fun kindLabel(ctx: Context, kind: String): String =
      ctx.getString(
          when (kind) {
            "photo" -> R.string.kind_photo
            "video" -> R.string.kind_video
            "video_note" -> R.string.kind_video_note
            "animation" -> R.string.kind_animation
            "audio" -> R.string.kind_audio
            "voice" -> R.string.kind_voice
            "document" -> R.string.kind_document
            else -> R.string.kind_file
          })

  private fun title(ctx: Context, job: DownloadJob): String =
      job.label.ifBlank { kindLabel(ctx, job.kind) }

  private fun openApp(ctx: Context): PendingIntent =
      PendingIntent.getActivity(
          ctx,
          0,
          Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
      )

  private fun base(ctx: Context, job: DownloadJob): NotificationCompat.Builder =
      NotificationCompat.Builder(ctx, CHANNEL_ID)
          .setSmallIcon(R.drawable.ic_stat_botgram)
          .setColor(ContextCompat.getColor(ctx, R.color.notification_accent))
          .setLargeIcon(PlaybackArt.largeIcon(ctx))
          .setContentTitle(title(ctx, job))
          .setSubText(kindLabel(ctx, job.kind))
          .setContentIntent(openApp(ctx))
          .setShowWhen(false)

  fun progress(ctx: Context, job: DownloadJob): Notification {
    val received = job.received
    val total = job.total
    val b =
        base(ctx, job)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
    if (total > 0) {
      val pct = ((received * 100) / total).toInt().coerceIn(0, 100)
      b.setProgress(100, pct, false)
      b.setContentText(
          ctx.getString(
              R.string.notif_dl_progress,
              pct,
              Formatter.formatShortFileSize(ctx, received),
              Formatter.formatShortFileSize(ctx, total),
          ))
    } else {
      b.setProgress(0, 0, true)
      b.setContentText(
          if (received > 0)
              ctx.getString(
                  R.string.notif_dl_progress_unknown,
                  Formatter.formatShortFileSize(ctx, received),
              )
          else ctx.getString(R.string.notif_dl_waiting))
    }
    val cancel =
        PendingIntent.getService(
            ctx,
            notificationId(job.id),
            Intent(ctx, DownloadService::class.java)
                .setAction(DownloadService.ACTION_CANCEL)
                .putExtra(DownloadService.EXTRA_ID, job.id),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    b.addAction(
        NotificationCompat.Action.Builder(0, ctx.getString(R.string.notif_dl_cancel), cancel)
            .build())
    return b.build()
  }

  fun done(ctx: Context, job: DownloadJob): Notification {
    val size = if (job.received > 0) job.received else job.total
    return base(ctx, job)
        .setCategory(NotificationCompat.CATEGORY_STATUS)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setContentText(
            if (size > 0)
                ctx.getString(R.string.notif_dl_done, Formatter.formatShortFileSize(ctx, size))
            else ctx.getString(R.string.notif_dl_done_nosize))
        .setProgress(0, 0, false)
        .setOngoing(false)
        .setAutoCancel(true)
        .setTimeoutAfter(6_000)
        .build()
  }

  fun failed(ctx: Context, job: DownloadJob, code: String): Notification {
    val text =
        when (code) {
          "PAYLOAD_TOO_LARGE" -> R.string.notif_dl_failed_size
          "storage_full" -> R.string.notif_dl_failed_storage
          "network_error" -> R.string.notif_dl_failed_network
          else -> R.string.notif_dl_failed
        }
    return base(ctx, job)
        .setCategory(NotificationCompat.CATEGORY_ERROR)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setContentText(ctx.getString(text))
        .setProgress(0, 0, false)
        .setOngoing(false)
        .setAutoCancel(true)
        .setTimeoutAfter(15_000)
        .build()
  }

  /** Notification de secours : Android impose d'en afficher une dès que le service démarre. */
  fun idle(ctx: Context): Notification =
      NotificationCompat.Builder(ctx, CHANNEL_ID)
          .setSmallIcon(R.drawable.ic_stat_botgram)
          .setColor(ContextCompat.getColor(ctx, R.color.notification_accent))
          .setContentTitle(ctx.getString(R.string.notif_dl_idle))
          .setPriority(NotificationCompat.PRIORITY_LOW)
          .setOngoing(true)
          .build()
}
