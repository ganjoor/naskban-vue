<script setup>
import { ref, watchEffect } from 'vue'
const loading = ref(false)
const userInfo = ref(null)
const ganjoorLink = ref(null)

watchEffect(async () => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) return
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf/ganjoor/nextunreviewed?skip=0`, {
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  ganjoorLink.value = await response.json()
})

async function reviewLink(result) {
  if (userInfo.value == null) return
  let apiRes = result == true ? 1 : 2
  loading.value = true
  const response = await fetch(
    `https://api.naskban.ir/api/pdf/ganjoor/review/${ganjoorLink.value.id}/${apiRes}`,
    {
      method: 'PUT',
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  loading.value = false
  if (!response.ok) {
    alert(await response.json())
    return
  }
  window.location.reload()
}
</script>
<template class="full-width">
  <div v-if="ganjoorLink == null">موردی پیشنهاد نشده</div>
  <q-card v-if="ganjoorLink != null">
    <q-bar>
      <div class="text-h6">بازبینی پیشنهادها</div>
      <q-space> </q-space>

      <q-btn label="تأیید" color="green" @click="reviewLink(true)" />
      <q-btn label="رد" color="red" @click="reviewLink(false)" />
    </q-bar>

    <q-card-section class="row">
      <div class="col">
        <iframe
          :src="`${ganjoorLink.entityFriendlyUrl.replace('https://naskban.ir', '')}`"
          style="width: 50vw; height: 70vh"
        ></iframe>
      </div>
      <div class="col">
        <iframe
          :src="`/ganjoor?url=${ganjoorLink.ganjoorUrl}`"
          id="ganjoorFrame"
          style="width: 50vw; height: 70vh"
        ></iframe>
      </div>
    </q-card-section>
  </q-card>
</template>
