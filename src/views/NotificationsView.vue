<script setup>
import { ref, onMounted, watch } from 'vue'
import * as NotificationService from '../utilities/NotificationService'
import { formatWithTime } from '../utilities/JalaliDate'

const loading = ref(true)
const userInfo = ref(null)
const notifications = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)

const detailDialogOpen = ref(false)
const openedNotification = ref(null)

async function loadNotifications() {
  loading.value = true
  const res = await NotificationService.getNotifications(userInfo.value, pageNumber.value)
  if (res) {
    notifications.value = res.items
    pageCount.value = res.pageCount
  }
  loading.value = false
}

function isUnread(n) {
  return n.status === NotificationService.NotificationStatus.unread
}

async function openNotification(n) {
  if (isUnread(n)) {
    const success = await NotificationService.switchStatus(userInfo.value, n.id)
    if (success) {
      n.status = NotificationService.NotificationStatus.read
    }
  }
  openedNotification.value = n
  detailDialogOpen.value = true
}

async function markAllRead() {
  const success = await NotificationService.markAllRead(userInfo.value)
  if (!success) return
  notifications.value.forEach((n) => {
    n.status = NotificationService.NotificationStatus.read
  })
}

watch(pageNumber, () => loadNotifications())

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  document.title = 'نسکبان - اعلان‌ها'
  if (userInfo.value != null) {
    loadNotifications()
  } else {
    loading.value = false
  }
})

function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/')">
        <q-tooltip class="bg-green text-white">بازگشت به خانه</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <div class="row justify-center items-center q-pa-sm">
    <h3 class="q-my-none">اعلان‌ها</h3>
    <q-btn
      v-if="!loading && userInfo != null && notifications.length > 0"
      dense
      flat
      icon="done_all"
      class="green q-ml-sm"
      @click="markAllRead"
    >
      <q-tooltip class="bg-green text-white">علامت‌گذاری همه به‌عنوان خوانده‌شده</q-tooltip>
    </q-btn>
  </div>

  <div v-if="!loading && userInfo == null" class="text-center q-pa-lg">
    برای مشاهدهٔ اعلان‌ها باید وارد حساب کاربری‌تان شوید.
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <q-list
    v-if="!loading && userInfo != null"
    bordered
    class="rounded-borders q-mx-auto"
    style="max-width: 600px"
  >
    <template v-for="(n, index) in notifications" :key="n.id">
      <q-item clickable @click="openNotification(n)">
        <q-item-section avatar>
          <q-icon
            :name="isUnread(n) ? 'mark_email_unread' : 'mark_email_read'"
            :color="isUnread(n) ? 'green' : 'grey-5'"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label :class="isUnread(n) ? 'text-bold' : ''">{{ n.subject }}</q-item-label>
          <q-item-label caption>{{ formatWithTime(n.dateTime) }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-separator v-if="index < notifications.length - 1" />
    </template>
    <div v-if="notifications.length === 0" class="text-center q-pa-lg">اعلانی وجود ندارد.</div>
  </q-list>

  <div class="q-pa-lg flex flex-center">
    <q-pagination
      v-model="pageNumber"
      v-if="!loading && userInfo != null && pageCount > 1"
      :max="pageCount"
      :max-pages="7"
      direction-links
      boundary-links
      color="green"
      icon-last="skip_previous"
      icon-first="skip_next"
      icon-next="fast_rewind"
      icon-prev="fast_forward"
    />
  </div>

  <q-dialog v-model="detailDialogOpen">
    <q-card style="min-width: 320px" v-if="openedNotification">
      <q-card-section class="text-h6">{{ openedNotification.subject }}</q-card-section>
      <q-card-section>{{ openedNotification.htmlText }}</q-card-section>
      <q-card-actions align="right">
        <q-btn label="بستن" @click="detailDialogOpen = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
