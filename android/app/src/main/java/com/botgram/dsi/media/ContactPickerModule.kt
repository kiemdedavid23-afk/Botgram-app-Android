package com.botgram.dsi.media

import android.app.Activity
import android.content.Intent
import android.provider.ContactsContract
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * JS : NativeModules.BotgramContactPicker
 *   pickContact() -> {phone_number, first_name, last_name?} | null (annulé)
 * Utilise le sélecteur de contacts du système : Android n'accorde l'accès qu'au contact
 * choisi, donc la permission READ_CONTACTS n'est PAS nécessaire.
 */
class ContactPickerModule(private val rc: ReactApplicationContext) :
    ReactContextBaseJavaModule(rc), ActivityEventListener {

  private var pending: Promise? = null

  init {
    rc.addActivityEventListener(this)
  }

  override fun getName(): String = "BotgramContactPicker"

  @ReactMethod
  fun pickContact(promise: Promise) {
    val activity = rc.currentActivity
    if (activity == null) {
      promise.reject("no_activity", "Aucune activité")
      return
    }
    if (pending != null) {
      promise.reject("busy", "Sélection déjà en cours")
      return
    }
    pending = promise
    try {
      activity.startActivityForResult(
          Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI),
          REQUEST_CODE,
      )
    } catch (e: Exception) {
      pending = null
      promise.reject("picker_unavailable", e.message, e)
    }
  }

  override fun onActivityResult(
      activity: Activity,
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
  ) {
    if (requestCode != REQUEST_CODE) return
    val promise = pending ?: return
    pending = null
    val uri = data?.data
    if (resultCode != Activity.RESULT_OK || uri == null) {
      promise.resolve(null)
      return
    }
    try {
      val projection =
          arrayOf(
              ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
              ContactsContract.CommonDataKinds.Phone.NUMBER,
          )
      rc.contentResolver.query(uri, projection, null, null, null)?.use { c ->
        if (c.moveToFirst()) {
          val display = (c.getString(0) ?: "").trim()
          val number = (c.getString(1) ?: "").trim()
          if (number.isEmpty()) {
            promise.reject("no_number", "Ce contact n'a pas de numéro")
            return
          }
          val cut = display.lastIndexOf(' ')
          val first = if (cut > 0) display.substring(0, cut).trim() else display
          val last = if (cut > 0) display.substring(cut + 1).trim() else ""
          val map = Arguments.createMap()
          map.putString("phone_number", number)
          map.putString("first_name", if (first.isEmpty()) number else first)
          if (last.isNotEmpty()) map.putString("last_name", last)
          promise.resolve(map)
          return
        }
      }
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("read_failed", e.message, e)
    }
  }

  override fun onNewIntent(intent: Intent) {}

  private companion object {
    const val REQUEST_CODE = 7311
  }
}
