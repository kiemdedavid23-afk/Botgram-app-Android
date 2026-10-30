package com.botgram.dsi.media

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.concurrent.atomic.AtomicBoolean

/**
 * JS : NativeModules.BotgramLocation
 *   getCurrentPosition() -> {latitude, longitude, accuracy}
 *   rejette « permission_denied », « location_disabled » ou « unavailable ».
 * Sans Google Play Services : LocationManager (GPS puis réseau).
 */
class LocationModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  override fun getName(): String = "BotgramLocation"

  private fun granted(p: String) =
      ContextCompat.checkSelfPermission(rc, p) == PackageManager.PERMISSION_GRANTED

  @ReactMethod
  fun getCurrentPosition(promise: Promise) {
    if (!granted(Manifest.permission.ACCESS_FINE_LOCATION) &&
        !granted(Manifest.permission.ACCESS_COARSE_LOCATION)) {
      promise.reject("permission_denied", "Permission de localisation refusée")
      return
    }
    val lm = rc.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    if (lm == null) {
      promise.reject("unavailable", "Service de localisation absent")
      return
    }
    val fine = granted(Manifest.permission.ACCESS_FINE_LOCATION)
    val providers =
        listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER).filter {
          (fine || it == LocationManager.NETWORK_PROVIDER) && runCatching { lm.isProviderEnabled(it) }.getOrDefault(false)
        }
    if (providers.isEmpty()) {
      promise.reject("location_disabled", "Localisation désactivée")
      return
    }
    try {
      val done = AtomicBoolean(false)
      val finish: (Location?) -> Unit = { loc ->
        if (done.compareAndSet(false, true)) {
          val best = loc ?: lastKnown(lm, providers)
          if (best == null) {
            promise.reject("unavailable", "Position introuvable")
          } else {
            val map = Arguments.createMap()
            map.putDouble("latitude", best.latitude)
            map.putDouble("longitude", best.longitude)
            map.putDouble("accuracy", if (best.hasAccuracy()) best.accuracy.toDouble() else 0.0)
            promise.resolve(map)
          }
        }
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        // Demande d'une position fraîche sur le fournisseur le plus précis disponible.
        lm.getCurrentLocation(providers.first(), null, rc.mainExecutor) { loc -> finish(loc) }
      } else {
        finish(null)
      }
    } catch (e: SecurityException) {
      promise.reject("permission_denied", e.message, e)
    } catch (e: Exception) {
      promise.reject("unavailable", e.message, e)
    }
  }

  @Suppress("MissingPermission")
  private fun lastKnown(lm: LocationManager, providers: List<String>): Location? =
      providers.mapNotNull { runCatching { lm.getLastKnownLocation(it) }.getOrNull() }
          .maxByOrNull { it.time }
}
