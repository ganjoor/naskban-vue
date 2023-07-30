<script setup>
import { useRoute } from 'vue-router'
import { ref, watchEffect } from 'vue'
import { VuePDF, usePDF } from '@tato30/vue-pdf'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()
const loading = ref(false)
const pdf = ref(null)
const pdfFile = ref(null)
const pageNumber = ref(1)

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
  if (route.params.page != null) {
    pageNumber.value = route.params.page
  }

  loading.value = true
  pdf.value = await (await fetch(url)).json()
  pdfFile.value = usePDF({
    url: pdf.value.externalPDFFileUrl,
    withCredentials: true,
    httpHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'range',
      'Access-Control-Expose-Headers': 'content-range, content-length, accept-ranges',
      'Access-Control-Allow-Methods': 'GET, OPTIONS'
    }
  })
  loading.value = false
  if (pageNumber.value == 1) {
    document.title = 'نسک‌بان - ' + pdf.value.title
  } else {
    document.title =
      'نسک‌بان - ' + pdf.value.title + ' - صفحهٔ ' + en2fa(pageNumber.value.toString())
  }
})
</script>

<template>
  <VuePDF :pdf="pdf" />
</template>
