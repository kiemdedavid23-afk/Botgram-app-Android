package com.botgram.dsi

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Botgram"

  override fun onCreate(savedInstanceState: Bundle?) {
    // react-native-screens refuse qu'Android restaure d'anciens fragments d'écran (ce qui arrive
    // quand le système a tué l'app, par exemple après un changement de permission) : on repart à neuf.
    super.onCreate(null)
    // Diagnostic temporaire : explique une fermeture inattendue au lancement précédent.
    CrashDiagnostics.showIfAny(this)
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
