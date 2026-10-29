package com.botgram.dsi.media

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.botgram.dsi.R
import java.io.ByteArrayOutputStream

/**
 * Image Botgram (icône ronde de l'app) pour les notifications :
 *  - grande icône des notifications de téléchargement,
 *  - pochette de la notification de lecture audio.
 * Calculée une seule fois puis gardée en mémoire.
 */
object PlaybackArt {

  @Volatile private var large: Bitmap? = null
  @Volatile private var png: ByteArray? = null

  private fun source(ctx: Context): Bitmap? =
      BitmapFactory.decodeResource(ctx.resources, R.mipmap.ic_launcher_round)

  /** 128 × 128, pour setLargeIcon. */
  fun largeIcon(ctx: Context): Bitmap? {
    large?.let {
      return it
    }
    val src = source(ctx) ?: return null
    val b = Bitmap.createScaledBitmap(src, 128, 128, true)
    large = b
    return b
  }

  /** PNG 256 × 256 pour la pochette (reste petit : il traverse la session média). */
  fun pngBytes(ctx: Context): ByteArray? {
    png?.let {
      return it
    }
    val src = source(ctx) ?: return null
    val scaled = Bitmap.createScaledBitmap(src, 256, 256, true)
    val out = ByteArrayOutputStream()
    scaled.compress(Bitmap.CompressFormat.PNG, 100, out)
    val bytes = out.toByteArray()
    png = bytes
    return bytes
  }
}
