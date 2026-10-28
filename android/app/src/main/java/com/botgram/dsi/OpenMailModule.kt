package com.botgram.dsi

import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Ouvre l'app de messagerie (boîte de réception) depuis l'écran « code de vérification ».
 * JS : NativeModules.OpenMail.openInbox(paquetPréféré | null) -> Promise<string>
 */
class OpenMailModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "OpenMail"

  @ReactMethod
  fun openInbox(preferredPackage: String?, promise: Promise) {
    try {
      // 1) L'app demandée (ex. Gmail) : son activité principale = la boîte de réception.
      if (!preferredPackage.isNullOrEmpty()) {
        val launch = reactContext.packageManager.getLaunchIntentForPackage(preferredPackage)
        if (launch != null) {
          launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          reactContext.startActivity(launch)
          promise.resolve("app")
          return
        }
      }
      // 2) Sinon : l'app de messagerie par défaut (ou le sélecteur Android).
      val mail = Intent(Intent.ACTION_MAIN)
      mail.addCategory(Intent.CATEGORY_APP_EMAIL)
      mail.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(mail)
      promise.resolve("default")
    } catch (e: Exception) {
      promise.reject("E_NO_MAIL_APP", e.message, e)
    }
  }
}
