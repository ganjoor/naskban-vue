<script setup>
import { ref, watch, nextTick } from 'vue'

// Renders the current page to its own <canvas> via pdf.js's standard
// getViewport/render API (page.render), rather than touching the live
// VuePDF component that's already showing the page - same reasoning as
// the Flutter client's own HighlightRegionSelector: an independent,
// static render is simpler and safer to build a selection UI against
// than the interactive view someone's already reading from.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  pdf: { type: Object, default: null }, // pdf.js document proxy (pdfFile.value.pdf)
  pageNumber: { type: Number, default: 1 }
})
const emit = defineEmits(['update:modelValue', 'selected'])

const canvasEl = ref(null)
const containerEl = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const confirming = ref(false)

const dragStart = ref(null)
const dragCurrent = ref(null)

async function renderPage() {
  loading.value = true
  errorMessage.value = ''
  dragStart.value = null
  dragCurrent.value = null
  try {
    const page = await props.pdf.getPage(props.pageNumber)
    // fixed target width, same reasoning as the Flutter client's own
    // selector - legible enough for a crop, small enough to keep
    // memory/upload size sane
    const targetWidth = 1400
    const nativeViewport = page.getViewport({ scale: 1 })
    const scale = targetWidth / nativeViewport.width
    const viewport = page.getViewport({ scale })

    await nextTick()
    const canvas = canvasEl.value
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
  } catch (e) {
    errorMessage.value = 'خطا در بارگذاری صفحه: ' + e.message
  }
  loading.value = false
}

function containerRect() {
  return containerEl.value.getBoundingClientRect()
}

function pointFromEvent(event) {
  const rect = containerRect()
  return {
    x: Math.min(Math.max(event.clientX - rect.left, 0), rect.width),
    y: Math.min(Math.max(event.clientY - rect.top, 0), rect.height)
  }
}

function onPointerDown(event) {
  if (loading.value) return
  dragStart.value = pointFromEvent(event)
  dragCurrent.value = dragStart.value
}

function onPointerMove(event) {
  if (dragStart.value == null) return
  dragCurrent.value = pointFromEvent(event)
}

function onPointerUp() {
  // kept as-is on release - onPointerDown starts the next selection fresh
}

function currentRect() {
  if (dragStart.value == null || dragCurrent.value == null) return null
  const left = Math.min(dragStart.value.x, dragCurrent.value.x)
  const top = Math.min(dragStart.value.y, dragCurrent.value.y)
  const width = Math.abs(dragCurrent.value.x - dragStart.value.x)
  const height = Math.abs(dragCurrent.value.y - dragStart.value.y)
  return { left, top, width, height }
}

function overlayStyle() {
  const rect = currentRect()
  if (rect == null) return { display: 'none' }
  return {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  }
}

async function confirm() {
  const rect = currentRect()
  const container = containerRect()
  if (rect == null || rect.width < 8 || rect.height < 8) {
    errorMessage.value = 'ابتدا با کشیدن ماوس روی تصویر، ناحیه‌ای را انتخاب کنید.'
    return
  }
  confirming.value = true

  const fx = rect.left / container.width
  const fy = rect.top / container.height
  const fw = rect.width / container.width
  const fh = rect.height / container.height

  const source = canvasEl.value
  const cropWidth = Math.max(1, Math.round(fw * source.width))
  const cropHeight = Math.max(1, Math.round(fh * source.height))
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = cropWidth
  cropCanvas.height = cropHeight
  const ctx = cropCanvas.getContext('2d')
  ctx.drawImage(
    source,
    fx * source.width,
    fy * source.height,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  )

  cropCanvas.toBlob((blob) => {
    confirming.value = false
    if (!blob) {
      errorMessage.value = 'خطا در برش تصویر.'
      return
    }
    emit('selected', { x: fx, y: fy, width: fw, height: fh, blob })
    emit('update:modelValue', false)
  }, 'image/png')
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) renderPage()
  }
)
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
    <q-card style="width: 90vw; max-width: 700px">
      <q-card-section>
        <div class="text-h6">انتخاب ناحیهٔ هایلایت</div>
        <div class="text-caption text-grey-7">
          با کشیدن ماوس روی تصویر، ناحیهٔ مورد نظر را انتخاب کنید.
        </div>
      </q-card-section>

      <q-card-section class="flex flex-center" style="min-height: 200px">
        <q-spinner-hourglass v-if="loading" color="green" size="3em" />
        <div v-else-if="errorMessage" class="text-red text-center">{{ errorMessage }}</div>
      </q-card-section>

      <q-card-section v-show="!loading" class="q-pa-none">
        <div
          ref="containerEl"
          style="position: relative; width: 100%; user-select: none; cursor: crosshair"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
        >
          <canvas ref="canvasEl" style="width: 100%; display: block" />
          <div
            :style="{
              position: 'absolute',
              border: '2px solid #ffc107',
              background: 'rgba(255, 193, 7, 0.25)',
              pointerEvents: 'none',
              ...overlayStyle()
            }"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="انصراف" :disable="confirming" @click="emit('update:modelValue', false)" />
        <q-btn
          color="primary"
          label="تأیید"
          :loading="confirming"
          :disable="loading"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
