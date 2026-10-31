package com.botgram.dsi.media

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

/**
 * Service au premier plan (type « location ») pour le partage de position en direct.
 * Il ne fait que lire la position et la transmettre à JS (événements) ; JS envoie au Worker.
 * Démarré depuis l'app visible : la permission « position en arrière-plan » n'est pas requise.
 */
class LiveLocationService : Service(), LocationListener {

  private var manager: LocationManager? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      sink?.invoke(EVENT_STOP, null)
      stopSelf()
      return START_NOT_STICKY
    }
    val title = intent?.getStringExtra(EXTRA_TITLE) ?: "Position en direct"
    val text = intent?.getStringExtra(EXTRA_TEXT) ?: ""
    val stopLabel = intent?.getStringExtra(EXTRA_STOP_LABEL) ?: "Arrêter"
    startAsForeground(buildNotification(title, text, stopLabel))
    startUpdates()
    running = true
    return START_NOT_STICKY
  }

  private fun startAsForeground(n: Notification) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(NOTIF_ID, n)
    }
  }

  private fun buildNotification(title: String, text: String, stopLabel: String): Notification {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      nm.createNotificationChannel(
          NotificationChannel(CHANNEL_ID, title, NotificationManager.IMPORTANCE_LOW))
    }
    val stop =
        PendingIntent.getService(
            this,
            0,
            Intent(this, LiveLocationService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    val open =
        packageManager.getLaunchIntentForPackage(packageName)?.let {
          PendingIntent.getActivity(this, 1, it, PendingIntent.FLAG_IMMUTABLE)
        }
    return NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(applicationInfo.icon)
        .setContentTitle(title)
        .setContentText(text)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setContentIntent(open)
        .addAction(0, stopLabel, stop)
        .build()
  }

  private fun granted(p: String) =
      ContextCompat.checkSelfPermission(this, p) == PackageManager.PERMISSION_GRANTED

  @Suppress("MissingPermission")
  private fun startUpdates() {
    val lm = getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return
    manager = lm
    val fine = granted(Manifest.permission.ACCESS_FINE_LOCATION)
    if (!fine && !granted(Manifest.permission.ACCESS_COARSE_LOCATION)) {
      sink?.invoke(EVENT_STOP, null)
      stopSelf()
      return
    }
    listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).forEach { p ->
      if (!fine && p == LocationManager.GPS_PROVIDER) return@forEach
      try {
        if (lm.isProviderEnabled(p)) {
          lm.requestLocationUpdates(p, 10_000L, 10f, this, Looper.getMainLooper())
        }
      } catch (_: Exception) {}
    }
  }

  override fun onLocationChanged(location: Location) {
    val map: WritableMap = Arguments.createMap()
    map.putDouble("latitude", location.latitude)
    map.putDouble("longitude", location.longitude)
    map.putDouble("accuracy", if (location.hasAccuracy()) location.accuracy.toDouble() else 0.0)
    // Telegram : cap 1–360 ; 0 = inconnu.
    val bearing = if (location.hasBearing()) Math.round(location.bearing).toInt() else 0
    map.putInt("heading", if (bearing in 1..360) bearing else 0)
    sink?.invoke(EVENT_UPDATE, map)
  }

  @Deprecated("Requis avant Android 11")
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}

  override fun onProviderEnabled(provider: String) {}

  override fun onProviderDisabled(provider: String) {}

  override fun onDestroy() {
    try {
      manager?.removeUpdates(this)
    } catch (_: Exception) {}
    running = false
    super.onDestroy()
  }

  companion object {
    const val ACTION_STOP = "com.botgram.dsi.LIVE_LOCATION_STOP"
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"
    const val EXTRA_STOP_LABEL = "stopLabel"
    const val EVENT_UPDATE = "BotgramLiveLocationUpdate"
    const val EVENT_STOP = "BotgramLiveLocationStop"
    private const val CHANNEL_ID = "live_location"
    private const val NOTIF_ID = 7312

    /** Branché par LiveLocationModule : (nom d'événement, données) → JS. */
    @Volatile var sink: ((String, WritableMap?) -> Unit)? = null
    @Volatile var running: Boolean = false
  }
}
