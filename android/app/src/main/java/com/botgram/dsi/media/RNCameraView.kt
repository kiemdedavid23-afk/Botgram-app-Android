package com.botgram.dsi.media

import android.widget.FrameLayout
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.uimanager.ThemedReactContext
import java.io.File
import java.lang.ref.WeakReference

/**
 * Aperçu caméra en direct (CameraX) + prise de photo.
 * Un seul aperçu actif à la fois : le dernier lié sert de cible à CameraModule.takePhoto().
 * Props (voir CameraViewManager) : active · front · flash("off"|"on"|"auto").
 */
class RNCameraView(private val rctx: ThemedReactContext) : FrameLayout(rctx) {

  var active = false
  var front = false
  var flash = "off"

  private var provider: ProcessCameraProvider? = null
  private var imageCapture: ImageCapture? = null
  private var boundActive = false
  private var boundFront = false

  // Déclaré AVANT init : addView() appelle requestLayout().
  private val measureAndLayout = Runnable {
    measure(
        MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
    )
    layout(left, top, right, bottom)
  }

  private val previewView =
      PreviewView(rctx).apply {
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        scaleType = PreviewView.ScaleType.FILL_CENTER
      }

  init {
    addView(previewView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  // React Native ne relance pas le layout des enfants natifs : on le force.
  override fun requestLayout() {
    super.requestLayout()
    post(measureAndLayout)
  }

  private fun flashMode(): Int =
      when (flash) {
        "on" -> ImageCapture.FLASH_MODE_ON
        "auto" -> ImageCapture.FLASH_MODE_AUTO
        else -> ImageCapture.FLASH_MODE_OFF
      }

  /** Appelé après chaque mise à jour des props. */
  fun commit() {
    if (!active) {
      unbind()
      return
    }
    // Seul le flash a changé : pas besoin de relancer la caméra.
    val capture = imageCapture
    if (boundActive && capture != null && boundFront == front) {
      capture.flashMode = flashMode()
      return
    }
    bind()
  }

  private fun bind() {
    val owner = rctx.currentActivity as? LifecycleOwner ?: return
    val future = ProcessCameraProvider.getInstance(rctx)
    future.addListener(
        {
          try {
            if (!active) return@addListener
            val p = future.get()
            provider = p
            val preview =
                Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
            val capture =
                ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .setFlashMode(flashMode())
                    .build()
            val selector =
                if (front) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
            p.unbindAll()
            p.bindToLifecycle(owner, selector, preview, capture)
            imageCapture = capture
            boundActive = true
            boundFront = front
            current = WeakReference(this)
          } catch (e: Exception) {
            // Caméra indisponible ou occupée : l'aperçu reste noir, takePhoto() échouera proprement.
            imageCapture = null
            boundActive = false
          }
        },
        ContextCompat.getMainExecutor(rctx),
    )
  }

  private fun unbind() {
    if (!boundActive && imageCapture == null) return
    try {
      provider?.unbindAll()
    } catch (e: Exception) {
      // déjà libérée
    }
    imageCapture = null
    boundActive = false
    if (current?.get() === this) current = null
  }

  fun takePhoto(promise: Promise) {
    val capture = imageCapture
    if (capture == null) {
      promise.reject("camera_not_ready", "La caméra n'est pas prête")
      return
    }
    val dir = File(rctx.cacheDir, "botgram-camera").also { if (!it.exists()) it.mkdirs() }
    val file = File(dir, "IMG_${System.currentTimeMillis()}.jpg")
    val options = ImageCapture.OutputFileOptions.Builder(file).build()
    capture.takePicture(
        options,
        ContextCompat.getMainExecutor(rctx),
        object : ImageCapture.OnImageSavedCallback {
          override fun onImageSaved(output: ImageCapture.OutputFileResults) {
            val map = Arguments.createMap()
            map.putString("uri", "file://${file.absolutePath}")
            map.putString("name", file.name)
            map.putString("mime", "image/jpeg")
            map.putDouble("size", file.length().toDouble())
            promise.resolve(map)
          }

          override fun onError(exception: ImageCaptureException) {
            promise.reject("capture_failed", exception.message, exception)
          }
        },
    )
  }

  fun release() {
    removeCallbacks(measureAndLayout)
    unbind()
  }

  companion object {
    @Volatile var current: WeakReference<RNCameraView>? = null
  }
}
