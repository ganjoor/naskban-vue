<script setup>
import { useRoute } from 'vue-router'
import { ref, watchEffect } from 'vue'
import { VuePDF, usePDF } from '@tato30/vue-pdf'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()
const loading = ref(false)
const pdf = ref(null)
const pdfFile = ref(null)
const pageNumber = ref(null)
const pageCount = ref(null)

function en2fa(num) {
  let arr = []
  const persian = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
  num.split('').map((number, index) => {
    arr[index] = persian[number]
  })
  return arr.join('')
}

watchEffect(async () => {
  const url = `${API_URL}/${route.params.id}`

  loading.value = true
  pdf.value = await (await fetch(url)).json()
  pdfFile.value = usePDF({
    url: pdf.value.externalPDFFileUrl
  })
  if (pageNumber.value == null) {
    if (route.params.page != null) {
      pageNumber.value = parseInt(route.params.page)
    } else {
      pageNumber.value = 1
    }
  }
  pageCount.value = pdfFile.value.pages

  if (pageNumber.value == 1) {
    document.title = 'نسک‌بان - ' + pdf.value.title
    window.history.pushState({}, '', '/' + pdf.value.id.toString() + '/1')
  } else {
    document.title =
      'نسک‌بان - ' + pdf.value.title + ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
    window.history.pushState(
      {},
      '',
      '/' + pdf.value.id.toString() + '/' + pageNumber.value.toString()
    )
  }
})

function onLoaded() {
  loading.value = false
}
function updatePageNumber(value){
  if (value == 1) {
    document.title = 'نسک‌بان - ' + pdf.value.title
    window.history.pushState({}, '', '/' + pdf.value.id.toString() + '/1')
  } else {
    document.title =
      'نسک‌بان - ' + pdf.value.title + ' - صفحهٔ ' + en2fa(value.toString())
    window.history.pushState(
      {},
      '',
      '/' + pdf.value.id.toString() + '/' + value.toString()
    )
  }
}
</script>

<template>
  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <div class="q-pa-lg flex flex-center justify-center centers">
      <q-pagination
        v-if="pdfFile != null"
        v-model="pageNumber"
        :max="pdfFile.pages"
        input
        input-class="text-orange-10"
        icon-last="skip_previous"
        icon-first="skip_next"
        icon-next="fast_rewind"
        icon-prev="fast_forward"
        @update:model-value="updatePageNumber"
      />
    </div>
    <div class="full-width q-pa-lg flex flex-center justify-center centers">
      <VuePDF v-if="pdfFile != null" :pdf="pdfFile.pdf" :page="pageNumber" @loaded="onLoaded" />
    </div>
  </div>
</template>
