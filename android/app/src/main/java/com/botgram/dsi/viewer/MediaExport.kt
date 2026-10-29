package com.botgram.dsi.viewer

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.botgram.dsi.R
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** Fournisseur de fichiers de Botgram (partage). Sous-classe : évite tout conflit avec d'autres bibliothèques. */
class BotgramFileProvider : FileProvider()

/**
 * Enregistrer une image dans la galerie (dossier « Botgram ») et la partager vers une autre app.
 * Appelé hors thread principal.
 */
object MediaExport {

  private const val GALLERY_FOLDER = "Botgram"
  private const val SHARE_DIR = "shared"
  private const val SHARE_KEEP_MS = 60 * 60 * 1000L

  /** Fichier local correspondant à un chemin ou une URI file:// ; null pour https:// ou content://. */
  fun resolveFile(uri: String): File? {
    val path =
        when {
          uri.startsWith("file://") -> Uri.parse(uri).path
          uri.startsWith("/") -> uri
          else -> null
        } ?: return null
    val f = File(path)
    return if (f.isFile) f else null
  }

  private fun imageMime(file: File): String {
    val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.absolutePath, opts)
    return opts.outMimeType ?: "image/jpeg"
  }

  private fun extensionFor(mime: String): String =
      when (mime) {
        "image/png" -> "png"
        "image/webp" -> "webp"
        "image/gif" -> "gif"
        "image/heic", "image/heif" -> "heic"
        else -> "jpg"
      }

  private fun newName(ext: String): String {
    val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    return "Botgram_$stamp.$ext"
  }

  /** Copie l'image dans Pictures/Botgram. Vrai si réussi. */
  fun saveImageToGallery(ctx: Context, uri: String): Boolean {
    val src = resolveFile(uri) ?: return false
    val mime = imageMime(src)
    val name = newName(extensionFor(mime))
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val values =
            ContentValues().apply {
              put(MediaStore.Images.Media.DISPLAY_NAME, name)
              put(MediaStore.Images.Media.MIME_TYPE, mime)
              put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/$GALLERY_FOLDER")
              put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        val resolver = ctx.contentResolver
        val target = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false
        try {
          resolver.openOutputStream(target)?.use { out -> src.inputStream().use { it.copyTo(out) } }
              ?: throw java.io.IOException("flux de sortie indisponible")
          values.clear()
          values.put(MediaStore.Images.Media.IS_PENDING, 0)
          resolver.update(target, values, null, null)
        } catch (e: Exception) {
          resolver.delete(target, null, null)
          throw e
        }
      } else {
        @Suppress("DEPRECATION")
        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), GALLERY_FOLDER)
        if (!dir.exists() && !dir.mkdirs()) return false
        val dest = File(dir, name)
        src.inputStream().use { i -> dest.outputStream().use { o -> i.copyTo(o) } }
        MediaScannerConnection.scanFile(ctx, arrayOf(dest.absolutePath), arrayOf(mime), null)
      }
      true
    } catch (_: Exception) {
      false
    }
  }

  /** Copie l'image dans le cache avec une vraie extension (certaines apps l'exigent) et renvoie son URI de partage. */
  fun prepareShare(ctx: Context, uri: String): Uri? {
    val src = resolveFile(uri) ?: return null
    return try {
      val dir = File(ctx.cacheDir, SHARE_DIR).apply { mkdirs() }
      val limit = System.currentTimeMillis() - SHARE_KEEP_MS
      dir.listFiles()?.forEach { if (it.lastModified() < limit) it.delete() }
      val dest = File(dir, newName(extensionFor(imageMime(src))))
      src.inputStream().use { i -> dest.outputStream().use { o -> i.copyTo(o) } }
      FileProvider.getUriForFile(ctx, "${ctx.packageName}.botgram.fileprovider", dest)
    } catch (_: Exception) {
      null
    }
  }

  /** Ouvre le sélecteur de partage d'Android. */
  fun startShare(ctx: Context, shareUri: Uri): Boolean {
    return try {
      val mime = ctx.contentResolver.getType(shareUri) ?: "image/*"
      val send =
          Intent(Intent.ACTION_SEND).apply {
            type = mime
            putExtra(Intent.EXTRA_STREAM, shareUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }
      val chooser =
          Intent.createChooser(send, ctx.getString(R.string.viewer_share_title))
              .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      ctx.startActivity(chooser)
      true
    } catch (_: Exception) {
      false
    }
  }
}
