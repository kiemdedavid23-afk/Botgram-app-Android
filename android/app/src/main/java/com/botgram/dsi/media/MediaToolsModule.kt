package com.botgram.dsi.media

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteOrder
import java.util.concurrent.Executors
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sqrt

/**
 * Miniatures vidéo et forme d'onde audio, calculées hors du thread principal puis mises en
 * cache sur disque (cacheDir : l'OS peut le purger, tout se régénère).
 *
 * JS : NativeModules.BotgramMediaTools
 *   videoInfo(path, id) -> {thumbUri, width, height, durationMs}
 *   waveform(path, id, bars) -> number[bars]  (0..100)   · rejette « waveform_failed » si illisible
 *   clearCaches()
 */
class MediaToolsModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {

  private val executor = Executors.newFixedThreadPool(2)

  override fun getName(): String = "BotgramMediaTools"

  private fun cacheSub(name: String): File =
      File(rc.cacheDir, name).also { if (!it.exists()) it.mkdirs() }

  private fun safe(id: String): String = id.replace(Regex("[^a-zA-Z0-9._-]"), "_")

  private fun localFile(path: String): String =
      if (path.startsWith("file://")) path.removePrefix("file://") else path

  // ---------------------------------------------------------------- Vidéo

  @ReactMethod
  fun videoInfo(path: String, id: String, promise: Promise) {
    executor.execute {
      val retriever = MediaMetadataRetriever()
      try {
        val file = localFile(path)
        retriever.setDataSource(file)
        val durationMs =
            retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()
                ?: 0L
        val thumb = File(cacheSub("botgram-thumbs"), "${safe(id)}.jpg")
        var w = 0
        var h = 0
        if (!thumb.exists() || thumb.length() == 0L) {
          // Image à ~1 s (ou au milieu pour les clips très courts) ; repli sur la première image.
          val atUs = minOf(1_000_000L, durationMs * 500L)
          val frame =
              retriever.getFrameAtTime(atUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                  ?: retriever.getFrameAtTime(0, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                  ?: throw IllegalStateException("no frame")
          val scaled = scaleDown(frame, 480)
          FileOutputStream(thumb).use { scaled.compress(Bitmap.CompressFormat.JPEG, 80, it) }
          w = scaled.width
          h = scaled.height
          if (scaled !== frame) frame.recycle()
          scaled.recycle()
        } else {
          val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
          BitmapFactory.decodeFile(thumb.absolutePath, opts)
          w = opts.outWidth
          h = opts.outHeight
        }
        val map = Arguments.createMap()
        map.putString("thumbUri", "file://${thumb.absolutePath}")
        map.putInt("width", w)
        map.putInt("height", h)
        map.putDouble("durationMs", durationMs.toDouble())
        promise.resolve(map)
      } catch (e: Exception) {
        promise.reject("video_info_failed", e.message ?: "Miniature impossible", e)
      } finally {
        try {
          retriever.release()
        } catch (_: Exception) {}
      }
    }
  }

  private fun scaleDown(src: Bitmap, maxSide: Int): Bitmap {
    val longest = max(src.width, src.height)
    if (longest <= maxSide) return src
    val ratio = maxSide.toFloat() / longest
    return Bitmap.createScaledBitmap(
        src,
        max(1, (src.width * ratio).toInt()),
        max(1, (src.height * ratio).toInt()),
        true,
    )
  }

  // ---------------------------------------------------------------- Forme d'onde

  @ReactMethod
  fun waveform(path: String, id: String, bars: Int, promise: Promise) {
    executor.execute {
      try {
        val n = bars.coerceIn(8, 200)
        val cache = File(cacheSub("botgram-wave"), "${safe(id)}.$n.bin")
        val values: IntArray
        if (cache.exists() && cache.length() == n.toLong()) {
          values = cache.readBytes().map { it.toInt() and 0xFF }.toIntArray()
        } else {
          values = computeWaveform(localFile(path), n)
          cache.writeBytes(ByteArray(n) { values[it].toByte() })
        }
        val arr = Arguments.createArray()
        for (v in values) arr.pushInt(v)
        promise.resolve(arr)
      } catch (e: Exception) {
        // JS dessine alors des barres de repli : ce n'est pas bloquant.
        promise.reject("waveform_failed", e.message ?: "Forme d'onde impossible", e)
      }
    }
  }

  /** Décode l'audio en PCM et retourne le pic de chaque tranche de temps (0..100). */
  private fun computeWaveform(path: String, bars: Int): IntArray {
    val extractor = MediaExtractor()
    var codec: MediaCodec? = null
    try {
      extractor.setDataSource(path)
      var track = -1
      var format: MediaFormat? = null
      for (i in 0 until extractor.trackCount) {
        val f = extractor.getTrackFormat(i)
        if (f.getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true) {
          track = i
          format = f
          break
        }
      }
      if (track < 0 || format == null) throw IllegalStateException("no audio track")
      val durationUs =
          if (format.containsKey(MediaFormat.KEY_DURATION)) format.getLong(MediaFormat.KEY_DURATION)
          else 0L
      if (durationUs <= 0L) throw IllegalStateException("unknown duration")
      extractor.selectTrack(track)

      val mime = format.getString(MediaFormat.KEY_MIME)!!
      codec = MediaCodec.createDecoderByType(mime)
      codec.configure(format, null, null, 0)
      codec.start()

      var sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
      var channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
      var floatPcm = false

      val peaks = FloatArray(bars)
      val info = MediaCodec.BufferInfo()
      var inputDone = false
      var outputDone = false
      val deadline = System.currentTimeMillis() + 30_000

      while (!outputDone) {
        if (System.currentTimeMillis() > deadline) throw IllegalStateException("timeout")
        if (!inputDone) {
          val inIdx = codec.dequeueInputBuffer(10_000)
          if (inIdx >= 0) {
            val inBuf = codec.getInputBuffer(inIdx)!!
            val size = extractor.readSampleData(inBuf, 0)
            if (size < 0) {
              codec.queueInputBuffer(inIdx, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
              inputDone = true
            } else {
              codec.queueInputBuffer(inIdx, 0, size, extractor.sampleTime, 0)
              extractor.advance()
            }
          }
        }
        val outIdx = codec.dequeueOutputBuffer(info, 10_000)
        when {
          outIdx >= 0 -> {
            val out = codec.getOutputBuffer(outIdx)
            if (out != null && info.size > 0) {
              out.position(info.offset)
              out.limit(info.offset + info.size)
              out.order(ByteOrder.nativeOrder())
              val usPerFrame = 1_000_000.0 / sampleRate
              if (floatPcm) {
                val fb = out.asFloatBuffer()
                var i = 0
                val total = fb.remaining()
                while (i < total) {
                  val frame = i / channels
                  val t = info.presentationTimeUs + (frame * usPerFrame).toLong()
                  val b = ((t * bars) / durationUs).toInt().coerceIn(0, bars - 1)
                  val a = abs(fb.get(i))
                  if (a > peaks[b]) peaks[b] = a
                  i++
                }
              } else {
                val sb = out.asShortBuffer()
                var i = 0
                val total = sb.remaining()
                while (i < total) {
                  val frame = i / channels
                  val t = info.presentationTimeUs + (frame * usPerFrame).toLong()
                  val b = ((t * bars) / durationUs).toInt().coerceIn(0, bars - 1)
                  val a = abs(sb.get(i).toInt()) / 32768f
                  if (a > peaks[b]) peaks[b] = a
                  i++
                }
              }
            }
            codec.releaseOutputBuffer(outIdx, false)
            if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) outputDone = true
          }
          outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
            val of = codec.outputFormat
            if (of.containsKey(MediaFormat.KEY_SAMPLE_RATE)) {
              sampleRate = of.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            }
            if (of.containsKey(MediaFormat.KEY_CHANNEL_COUNT)) {
              channels = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            }
            // 4 = ENCODING_PCM_FLOAT ; absent = 16 bits.
            floatPcm =
                of.containsKey(MediaFormat.KEY_PCM_ENCODING) &&
                    of.getInteger(MediaFormat.KEY_PCM_ENCODING) == 4
          }
        }
      }

      val peak = peaks.maxOrNull() ?: 0f
      if (peak <= 0f) return IntArray(bars) { 4 }
      // Racine carrée : les passages calmes restent visibles. Plancher de 4 pour garder une barre.
      return IntArray(bars) { max(4, (sqrt(peaks[it] / peak) * 100f).toInt()) }
    } finally {
      try {
        codec?.stop()
      } catch (_: Exception) {}
      try {
        codec?.release()
      } catch (_: Exception) {}
      extractor.release()
    }
  }

  @ReactMethod
  fun clearCaches(promise: Promise) {
    executor.execute {
      try {
        File(rc.cacheDir, "botgram-thumbs").deleteRecursively()
        File(rc.cacheDir, "botgram-wave").deleteRecursively()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("clear_failed", e.message, e)
      }
    }
  }

  override fun invalidate() {
    executor.shutdownNow()
    super.invalidate()
  }
}
