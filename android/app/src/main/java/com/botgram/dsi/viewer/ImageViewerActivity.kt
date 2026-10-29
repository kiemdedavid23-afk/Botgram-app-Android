package com.botgram.dsi.viewer

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Color as AndroidColor
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.StringRes
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animate
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.botgram.dsi.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import me.saket.telephoto.zoomable.coil.ZoomableAsyncImage
import org.json.JSONArray
import java.io.File
import kotlin.math.abs

/** Une image à afficher. `uri` = chemin local, file://, content:// ou https://. */
data class ViewerItem(val uri: String, val title: String?) {
  /** Enregistrer / partager ne marchent que pour un fichier du téléphone. */
  val canExport: Boolean
    get() = MediaExport.resolveFile(uri) != null
}

/**
 * Visionneuse d'images plein écran de toute l'app (photos des conversations, albums, photo du bot,
 * photo du membre…). Ouverte depuis le JS par [ImageViewerModule].
 *
 *  - zoom au pincement et double-tap, déplacement, grandes photos découpées en tuiles (Telephoto),
 *  - glisser à gauche / droite pour passer à l'image suivante,
 *  - glisser vers le bas pour fermer (le fond s'éclaircit pendant le geste),
 *  - un appui masque / affiche les boutons,
 *  - boutons : fermer, enregistrer dans la galerie (dossier Botgram), partager.
 */
class ImageViewerActivity : ComponentActivity() {

  companion object {
    const val EXTRA_ITEMS = "items"
    const val EXTRA_INDEX = "index"
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge(
        statusBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
        navigationBarStyle = SystemBarStyle.dark(AndroidColor.TRANSPARENT),
    )
    super.onCreate(savedInstanceState)

    val items = parseItems(intent.getStringExtra(EXTRA_ITEMS))
    if (items.isEmpty()) {
      finish()
      return
    }
    val start = intent.getIntExtra(EXTRA_INDEX, 0).coerceIn(0, items.lastIndex)
    setContent { ViewerScreen(items = items, startIndex = start, onClose = { finish() }) }
  }

  private fun parseItems(json: String?): List<ViewerItem> {
    if (json.isNullOrBlank()) return emptyList()
    return try {
      val arr = JSONArray(json)
      val out = ArrayList<ViewerItem>(arr.length())
      for (i in 0 until arr.length()) {
        val o = arr.optJSONObject(i) ?: continue
        val uri = o.optString("uri", "")
        if (uri.isBlank()) continue
        val title = o.optString("title", "").ifBlank { null }
        out.add(ViewerItem(uri, title))
      }
      out
    } catch (_: Exception) {
      emptyList()
    }
  }
}

/** Les chemins absolus sont chargés comme fichiers ; le reste (file://, https://) tel quel. */
private fun modelFor(uri: String): Any = if (uri.startsWith("/")) File(uri) else uri

@Composable
private fun ViewerScreen(items: List<ViewerItem>, startIndex: Int, onClose: () -> Unit) {
  val ctx = LocalContext.current
  val scope = rememberCoroutineScope()
  val pagerState = rememberPagerState(initialPage = startIndex, pageCount = { items.size })

  var chromeVisible by remember { mutableStateOf(true) }
  var offsetY by remember { mutableFloatStateOf(0f) }
  var pendingSave by remember { mutableStateOf<ViewerItem?>(null) }

  val dismissPx = with(LocalDensity.current) { 140.dp.toPx() }
  val backgroundAlpha = (1f - abs(offsetY) / (dismissPx * 3f)).coerceIn(0.3f, 1f)

  fun toast(@StringRes id: Int) {
    Toast.makeText(ctx, id, Toast.LENGTH_SHORT).show()
  }

  fun doSave(item: ViewerItem) {
    scope.launch {
      val ok = withContext(Dispatchers.IO) { MediaExport.saveImageToGallery(ctx, item.uri) }
      toast(if (ok) R.string.viewer_saved else R.string.viewer_save_failed)
    }
  }

  val storagePermission =
      rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val item = pendingSave
        pendingSave = null
        if (granted && item != null) doSave(item) else toast(R.string.viewer_permission_denied)
      }

  fun requestSave(item: ViewerItem) {
    // Android 10+ : enregistrer dans la galerie ne demande aucune autorisation.
    val needsPermission =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.WRITE_EXTERNAL_STORAGE) !=
                PackageManager.PERMISSION_GRANTED
    if (needsPermission) {
      pendingSave = item
      storagePermission.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
    } else {
      doSave(item)
    }
  }

  fun share(item: ViewerItem) {
    scope.launch {
      val ok = withContext(Dispatchers.IO) { MediaExport.prepareShare(ctx, item.uri) }
      if (ok == null || !MediaExport.startShare(ctx, ok)) toast(R.string.viewer_share_failed)
    }
  }

  val dragState = rememberDraggableState { delta -> offsetY += delta }

  Box(
      modifier =
          Modifier.fillMaxSize()
              .background(Color.Black.copy(alpha = backgroundAlpha))
              .draggable(
                  state = dragState,
                  orientation = Orientation.Vertical,
                  onDragStopped = { velocity ->
                    if (abs(offsetY) > dismissPx || abs(velocity) > 2500f) {
                      onClose()
                    } else {
                      scope.launch { animate(offsetY, 0f) { value, _ -> offsetY = value } }
                    }
                  },
              )) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize().graphicsLayer { translationY = offsetY },
            pageSpacing = 16.dp,
            key = { index -> "$index:${items[index].uri}" },
        ) { page ->
          ZoomableAsyncImage(
              model = modelFor(items[page].uri),
              contentDescription = null,
              modifier = Modifier.fillMaxSize(),
              onClick = { chromeVisible = !chromeVisible },
          )
        }

        val current = items[pagerState.currentPage.coerceIn(0, items.lastIndex)]

        AnimatedVisibility(
            visible = chromeVisible && offsetY == 0f,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.align(Alignment.TopCenter),
        ) {
          Row(
              modifier = Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 8.dp, vertical = 8.dp),
              verticalAlignment = Alignment.CenterVertically,
              horizontalArrangement = Arrangement.Start,
          ) {
            RoundButton(R.drawable.ic_viewer_close, stringResource(R.string.viewer_close)) { onClose() }
            Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
              if (items.size > 1) {
                BasicText(
                    text = "${pagerState.currentPage + 1} / ${items.size}",
                    style = TextStyle(color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Medium),
                )
              }
            }
            if (current.canExport) {
              RoundButton(R.drawable.ic_viewer_save, stringResource(R.string.viewer_save)) { requestSave(current) }
              Spacer(Modifier.width(8.dp))
              RoundButton(R.drawable.ic_viewer_share, stringResource(R.string.viewer_share)) { share(current) }
            }
          }
        }

        val title = current.title
        if (!title.isNullOrBlank()) {
          AnimatedVisibility(
              visible = chromeVisible && offsetY == 0f,
              enter = fadeIn(),
              exit = fadeOut(),
              modifier = Modifier.align(Alignment.BottomCenter),
          ) {
            Box(
                modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 24.dp, vertical = 16.dp),
                contentAlignment = Alignment.Center,
            ) {
              BasicText(
                  text = title,
                  style = TextStyle(color = Color.White, fontSize = 15.sp),
                  maxLines = 3,
              )
            }
          }
        }
      }
}

@Composable
private fun RoundButton(iconRes: Int, description: String, onClick: () -> Unit) {
  Box(
      modifier =
          Modifier.size(48.dp)
              .clip(CircleShape)
              .background(Color(0x66000000))
              .clickable(onClick = onClick),
      contentAlignment = Alignment.Center,
  ) {
    Image(
        painter = painterResource(iconRes),
        contentDescription = description,
        modifier = Modifier.size(24.dp),
    )
  }
}
