<script setup>
import { ref, onMounted } from 'vue'
import { bus } from '../event-bus'
import * as ShelfService from '../utilities/ShelfService'

const loading = ref(false)
const userInfo = ref(null)
const shelves = ref([])
const shelfBookCounts = ref({})

bus.on('user-logged-out', () => {
  userInfo.value = null
})

async function loadShelves() {
  loading.value = true
  const [allShelves, allShelfBooks] = await Promise.all([
    ShelfService.getAllShelves(userInfo.value),
    ShelfService.getAllShelfBooks(userInfo.value)
  ])
  shelves.value = allShelves
  const counts = {}
  for (const sb of allShelfBooks) {
    counts[sb.shelfId] = (counts[sb.shelfId] || 0) + 1
  }
  shelfBookCounts.value = counts
  loading.value = false
}

onMounted(async () => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  if (userInfo.value == null) {
    window.location.href = '/login'
    return
  }
  document.title = 'نسکبان - قفسه‌های من'
  await loadShelves()
})

async function createShelf() {
  const name = prompt('نام قفسهٔ جدید')
  if (!name) return
  loading.value = true
  const shelf = await ShelfService.createShelf(userInfo.value, name)
  if (shelf == null) {
    loading.value = false
    alert('قفسه‌ای با این نام از قبل وجود دارد.')
    return
  }
  await loadShelves()
}

async function renameShelf(shelf) {
  const name = prompt('نام جدید', shelf.name)
  if (!name || name === shelf.name) return
  loading.value = true
  const success = await ShelfService.renameShelf(userInfo.value, shelf, name)
  if (!success) {
    loading.value = false
    alert('قفسه‌ای با این نام از قبل وجود دارد.')
    return
  }
  await loadShelves()
}

async function deleteShelf(shelf) {
  if (!confirm(`قفسهٔ «${shelf.name}» حذف شود؟ (کتاب‌های آن از قفسه‌های دیگرشان حذف نمی‌شوند)`)) return
  loading.value = true
  await ShelfService.deleteShelf(userInfo.value, shelf)
  await loadShelves()
}

function openShelf(shelf) {
  window.location.href = '/shelves/' + shelf.id
}
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
      <q-separator vertical inset spaced />
      <q-btn dense flat icon="add" class="green" @click="createShelf">
        <q-tooltip class="bg-green text-white">قفسهٔ جدید</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <h3>قفسه‌های من</h3>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div class="row justify-center" v-if="!loading">
    <div class="pdf flex q-ma-sm" v-for="shelf in shelves" :key="shelf.id">
      <q-card class="fit" style="width: 200px">
        <q-card-section class="text-h6 cursor-pointer" @click="openShelf(shelf)">
          {{ shelf.name }}
        </q-card-section>
        <q-card-section class="cursor-pointer" @click="openShelf(shelf)">
          {{ shelfBookCounts[shelf.id] || 0 }} کتاب
        </q-card-section>
        <q-card-actions align="right">
          <q-btn dense flat icon="edit" @click="renameShelf(shelf)">
            <q-tooltip class="bg-green text-white">تغییر نام</q-tooltip>
          </q-btn>
          <q-btn dense flat icon="delete" @click="deleteShelf(shelf)">
            <q-tooltip class="bg-green text-white">حذف قفسه</q-tooltip>
          </q-btn>
        </q-card-actions>
      </q-card>
    </div>
    <div v-if="shelves.length === 0" class="text-center full-width q-pa-lg">
      هنوز قفسه‌ای نساخته‌اید. برای شروع روی «+» بزنید.
    </div>
  </div>
</template>

<style>
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
