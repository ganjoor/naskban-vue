<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as ShelfService from '../utilities/ShelfService'

const route = useRoute()
const loading = ref(false)
const userInfo = ref(null)
const shelf = ref(null)
const books = ref([])

async function load() {
  loading.value = true
  const [allShelves, shelfBooks] = await Promise.all([
    ShelfService.getAllShelves(userInfo.value),
    ShelfService.getBooksInShelf(userInfo.value, route.params.id)
  ])
  shelf.value = allShelves.find((s) => s.id === route.params.id) || null
  books.value = shelfBooks
  document.title = 'نسکبان - قفسهٔ ' + (shelf.value ? shelf.value.name : '')
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
  await load()
})

async function removeBook(book) {
  if (!confirm('این کتاب از قفسه حذف شود؟')) return
  loading.value = true
  await ShelfService.removeBookFromShelf(userInfo.value, route.params.id, book.bookId)
  await load()
}
function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/shelves')">
        <q-tooltip class="bg-green text-white">بازگشت به قفسه‌ها</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <h3 v-if="shelf">{{ shelf.name }}</h3>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div class="row justify-center" v-if="!loading">
    <div class="pdf flex q-ma-sm" v-for="book in books" :key="book.bookId">
      <a :href="'/' + book.bookId">
        <q-card class="fit">
          <q-img
            :src="book.thumbnailUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          />
          <q-card-section class="text-h6">
            {{ book.bookTitle }}
          </q-card-section>
        </q-card>
      </a>
      <q-btn label="حذف از قفسه" @click="removeBook(book)" />
    </div>
    <div v-if="books.length === 0" class="text-center full-width q-pa-lg">
      این قفسه هنوز کتابی ندارد.
    </div>
  </div>
</template>

<style>
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
