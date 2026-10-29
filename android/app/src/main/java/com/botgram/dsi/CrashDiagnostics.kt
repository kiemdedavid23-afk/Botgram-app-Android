package com.botgram.dsi

import android.app.Activity
import android.app.ActivityManager
import android.app.ApplicationExitInfo
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AlertDialog
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Outil de diagnostic TEMPORAIRE : explique pourquoi l'app s'est fermée toute seule.
 *
 * - Un plantage Java/Kotlin (y compris une erreur JavaScript fatale) est écrit dans un fichier
 *   juste avant la fermeture.
 * - Android 11+ garde la raison de la dernière mort du processus (plantage natif, ANR, échec
 *   d'initialisation…) : on la relit au lancement suivant.
 * Au lancement suivant, une fenêtre affiche le rapport avec « Copier » et « Partager ».
 * Aucune fenêtre n'apparaît si l'app s'est fermée normalement.
 */
object CrashDiagnostics {

  private const val CRASH_FILE = "last_crash_report.txt"
  private const val PREFS = "botgram_diagnostics"
  private const val KEY_LAST_EXIT = "last_exit_ts"
  private const val DAY_MS = 24L * 60 * 60 * 1000

  private fun stamp(ms: Long): String =
      SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.FRANCE).format(Date(ms))

  /** À appeler le plus tôt possible (MainApplication.onCreate). */
  fun install(ctx: Context) {
    val previous = Thread.getDefaultUncaughtExceptionHandler()
    Thread.setDefaultUncaughtExceptionHandler { thread, error ->
      try {
        val text =
            "Plantage de l’application · ${stamp(System.currentTimeMillis())}\n" +
                "Thread : ${thread.name}\n\n${Log.getStackTraceString(error)}"
        File(ctx.filesDir, CRASH_FILE).writeText(text.take(8000))
      } catch (_: Throwable) {
        // le diagnostic ne doit jamais aggraver un plantage
      }
      previous?.uncaughtException(thread, error)
    }
  }

  /** Affiche le rapport du dernier arrêt inattendu, s'il y en a un (MainActivity.onCreate). */
  fun showIfAny(activity: Activity) {
    val report = consumeReport(activity) ?: return
    try {
      AlertDialog.Builder(activity)
          .setTitle("Botgram s’est fermé la dernière fois")
          .setMessage(report.take(3500))
          .setPositiveButton("Copier") { _, _ ->
            val cm = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            cm.setPrimaryClip(ClipData.newPlainText("Botgram", report))
            Toast.makeText(activity, "Rapport copié", Toast.LENGTH_SHORT).show()
          }
          .setNeutralButton("Partager") { _, _ ->
            val send =
                Intent(Intent.ACTION_SEND).apply {
                  type = "text/plain"
                  putExtra(Intent.EXTRA_TEXT, report)
                }
            activity.startActivity(Intent.createChooser(send, "Partager le rapport"))
          }
          .setNegativeButton("Fermer", null)
          .show()
    } catch (_: Throwable) {
      // fenêtre impossible à afficher : tant pis, jamais bloquant
    }
  }

  private fun consumeReport(ctx: Context): String? {
    val parts = ArrayList<String>()
    val file = File(ctx.filesDir, CRASH_FILE)
    if (file.exists()) {
      try {
        parts.add(file.readText())
      } catch (_: Exception) {}
      file.delete()
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      exitReport(ctx)?.let { parts.add(it) }
    }
    if (parts.isEmpty()) return null
    return parts.joinToString("\n\n— — —\n\n") +
        "\n\nAppareil : ${Build.MANUFACTURER} ${Build.MODEL} · Android ${Build.VERSION.RELEASE}"
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun exitReport(ctx: Context): String? {
    val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val exits = am.getHistoricalProcessExitReasons(ctx.packageName, 0, 5)
    if (exits.isEmpty()) return null

    val last = prefs.getLong(KEY_LAST_EXIT, 0L)
    prefs.edit().putLong(KEY_LAST_EXIT, exits.maxOf { it.timestamp }).apply()
    val since = if (last == 0L) System.currentTimeMillis() - DAY_MS else last

    val interesting =
        setOf(
            ApplicationExitInfo.REASON_CRASH,
            ApplicationExitInfo.REASON_CRASH_NATIVE,
            ApplicationExitInfo.REASON_ANR,
            ApplicationExitInfo.REASON_INITIALIZATION_FAILURE,
        )
    val e =
        exits.filter { it.timestamp > since && it.reason in interesting }.maxByOrNull { it.timestamp }
            ?: return null

    val cause =
        when (e.reason) {
          ApplicationExitInfo.REASON_CRASH -> "plantage Java/Kotlin ou erreur JavaScript fatale"
          ApplicationExitInfo.REASON_CRASH_NATIVE -> "plantage natif (C++)"
          ApplicationExitInfo.REASON_ANR -> "l’application ne répondait plus (ANR)"
          ApplicationExitInfo.REASON_INITIALIZATION_FAILURE -> "échec d’initialisation au démarrage"
          else -> "autre (${e.reason})"
        }
    return "Arrêt inattendu · ${stamp(e.timestamp)}\n" +
        "Cause : $cause\n" +
        "Détail Android : ${e.description ?: "aucun"}\n" +
        "Processus : ${e.processName}"
  }
}
