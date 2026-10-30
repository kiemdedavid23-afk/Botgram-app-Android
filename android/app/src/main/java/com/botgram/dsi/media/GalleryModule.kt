package com.botgram.dsi.media

import android.content.ContentResolver
import android.content.ContentUris
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import java.util.concurrent.Executors

/**
 * Galerie du téléphone : photos et vidéos, de la plus récente à la plus ancienne, par pages.
 * Sur Android 14 avec accès partiel, MediaStore ne renvoie que les éléments autorisés.
 *
 * JS : NativeModules.BotgramGallery
 *   queryAssets(offset, limit) -> [{id, uri, type: "photo"|"video", mime, name, size,
 *                                   durationMs, width, height, at}]
 *   rejette « permission_denied » si l'accès a été retiré, « query_failed » sinon.
 */
class GalleryModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  private val executor = Executors.newSingleThreadExecutor()

  override fun getName(): String = "BotgramGallery"

  @ReactMethod
  fun queryAssets(offset: Int, limit: Int, promise: Promise) {
    executor.execute {
      try {
        promise.resolve(query(offset.coerceAtLeast(0), limit.coerceIn(1, 200)))
      } catch (e: SecurityException) {
        promise.reject("permission_denied", e.message, e)
      } catch (e: Exception) {
        promise.reject("query_failed", e.message, e)
      }
    }
  }

  private fun query(offset: Int, limit: Int): WritableArray {
    val out = Arguments.createArray()
    val files = MediaStore.Files.getContentUri("external")
    val cols = mutableListOf(
        MediaStore.Files.FileColumns._ID,
        MediaStore.Files.FileColumns.MEDIA_TYPE,
        MediaStore.Files.FileColumns.MIME_TYPE,
        MediaStore.Files.FileColumns.DISPLAY_NAME,
        MediaStore.Files.FileColumns.SIZE,
        MediaStore.Files.FileColumns.DATE_ADDED,
        MediaStore.Files.FileColumns.WIDTH,
        MediaStore.Files.FileColumns.HEIGHT,
    )
    if (Build.VERSION.SDK_INT >= 29) cols.add(MediaStore.MediaColumns.DURATION)
    val selection = "${MediaStore.Files.FileColumns.MEDIA_TYPE} IN (?, ?)"
    val args = arrayOf(
        MediaStore.Files.FileColumns.MEDIA_TYPE_IMAGE.toString(),
        MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO.toString(),
    )
    val projection = cols.toTypedArray()
    val resolver = rc.contentResolver

    val cursor: Cursor? =
        if (Build.VERSION.SDK_INT >= 26) {
          val bundle = Bundle().apply {
            putString(ContentResolver.QUERY_ARG_SQL_SELECTION, selection)
            putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, args)
            putStringArray(
                ContentResolver.QUERY_ARG_SORT_COLUMNS,
                arrayOf(MediaStore.Files.FileColumns.DATE_ADDED),
            )
            putInt(
                ContentResolver.QUERY_ARG_SORT_DIRECTION,
                ContentResolver.QUERY_SORT_DIRECTION_DESCENDING,
            )
            putInt(ContentResolver.QUERY_ARG_LIMIT, limit)
            putInt(ContentResolver.QUERY_ARG_OFFSET, offset)
          }
          resolver.query(files, projection, bundle, null)
        } else {
          resolver.query(
              files,
              projection,
              selection,
              args,
              "${MediaStore.Files.FileColumns.DATE_ADDED} DESC",
          )
        }

    cursor?.use { c ->
      // Avant Android 8 : pas de pagination native, on saute les lignes déjà lues.
      if (Build.VERSION.SDK_INT < 26 && offset > 0 && !c.moveToPosition(offset - 1)) return out

      val iId = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns._ID)
      val iType = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MEDIA_TYPE)
      val iMime = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.MIME_TYPE)
      val iName = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DISPLAY_NAME)
      val iSize = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.SIZE)
      val iDate = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.DATE_ADDED)
      val iW = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.WIDTH)
      val iH = c.getColumnIndexOrThrow(MediaStore.Files.FileColumns.HEIGHT)
      val iDur =
          if (Build.VERSION.SDK_INT >= 29) c.getColumnIndex(MediaStore.MediaColumns.DURATION)
          else -1

      var count = 0
      while (count < limit && c.moveToNext()) {
        val id = c.getLong(iId)
        val isVideo = c.getInt(iType) == MediaStore.Files.FileColumns.MEDIA_TYPE_VIDEO
        val base: Uri =
            if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        val map = Arguments.createMap()
        map.putString("id", id.toString())
        map.putString("uri", ContentUris.withAppendedId(base, id).toString())
        map.putString("type", if (isVideo) "video" else "photo")
        map.putString("mime", c.getString(iMime) ?: if (isVideo) "video/mp4" else "image/jpeg")
        map.putString("name", c.getString(iName) ?: "")
        map.putDouble("size", c.getLong(iSize).toDouble())
        map.putDouble("durationMs", if (iDur >= 0) c.getLong(iDur).toDouble() else 0.0)
        map.putInt("width", c.getInt(iW))
        map.putInt("height", c.getInt(iH))
        map.putDouble("at", c.getLong(iDate) * 1000.0)
        out.pushMap(map)
        count++
      }
    }
    return out
  }
}
