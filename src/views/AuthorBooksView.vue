<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fa2en } from '../fa2en'
import PermissionChecker from '../utilities/PermissionChecker'
import * as PinnedAuthorService from '../utilities/PinnedAuthorService'
import AuthorPickerDialog from '../components/AuthorPickerDialog.vue'

const route = useRoute()
const loading = ref(true)
const userInfo = ref(null)
const authorName = ref('')
const pdfs = ref([])
const pageCount = ref(1)
const pageNumber = ref(1)
const pinned = ref(false)
const canDelete = ref(false)
const mergeAuthorDialogOpen = ref(false)

// the only three roles AuthorRole.Role ever holds - hardcoded rather than
// fetched, since there's no listing endpoint for this and the set is
// small and effectively fixed
const authorRoles = ['نویسنده', 'مترجم', 'مصحح']
const selectedRole = ref(null) // null means "همه" - every role

function checkPermission(secShortName, opShortName) {
  return PermissionChecker.check(userInfo.value, secShortName, opShortName)
}

function selectRole(role) {
  if (role === selectedRole.value) return
  selectedRole.value = role
  pageNumber.value = 1
  loadBooks()
}

async function loadBooks() {
  loading.value = true
  const roleQuery = selectedRole.value
    ? `&role=${encodeURIComponent(selectedRole.value)}`
    : ''
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/pdfbook/by/contributer/${route.params.id}?PageNumber=${pageNumber.value}&PageSize=21${roleQuery}`,
    { headers: { 'content-type': 'application/json' } }
  )
  if (res.ok) {
    pdfs.value = await res.json()
    for (const pair of res.headers.entries()) {
      if (pair[0] == 'paging-headers') {
        pageCount.value = JSON.parse(pair[1]).totalPages
      }
    }
  }
  loading.value = false
}

async function loadAuthorName() {
  const res = await fetch(`https://api.naskban.ir/api/pdf/author/${route.params.id}`, {
    headers: { 'content-type': 'application/json' }
  })
  if (res.ok) {
    const author = await res.json()
    authorName.value = author.name
    document.title = 'نسکبان - ' + author.name
  }
}

async function loadPinned() {
  if (userInfo.value == null) return
  pinned.value = await PinnedAuthorService.isPinned(userInfo.value, route.params.id)
}

async function togglePin() {
  if (userInfo.value == null) return
  if (pinned.value) {
    await PinnedAuthorService.unpinAuthor(userInfo.value, route.params.id)
  } else {
    await PinnedAuthorService.pinAuthor(userInfo.value, route.params.id)
  }
  pinned.value = !pinned.value
}

async function deletePDFBook(id, title) {
  if (!confirm(`آیا از حذف ${title} اطمینان دارید؟`)) {
    return
  }
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf/${id}`, {
    method: 'DELETE',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!response.ok) {
    alert(`${title} - ${await response.json()}`)
    return
  }
  alert(`${title} حذف شد!`)
}

async function mergePDFBook(id, title) {
  const raw = prompt(
    `شناسهٔ کتاب تکراری که در «${title}» ادغام و حذف شود را وارد کنید`
  )
  if (!raw) return
  const duplicateId = fa2en(raw.trim())
  if (!/^\d+$/.test(duplicateId)) {
    alert('شناسهٔ کتاب باید یک عدد باشد.')
    return
  }
  if (
    !confirm(
      `کتاب با شناسهٔ ${duplicateId} در «${title}» ادغام و حذف شود؟ این عملیات قابل بازگشت نیست.`
    )
  ) {
    return
  }
  loading.value = true
  const response = await fetch(`https://api.naskban.ir/api/pdf/merge/${id}/${duplicateId}`, {
    method: 'PUT',
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
  alert('ادغام با موفقیت انجام شد!')
}

async function onDuplicateAuthorPicked(duplicate) {
  if (
    !confirm(
      `پدیدآورندهٔ «${duplicate.name}» (${duplicate.bookCount} کتاب) در «${authorName.value}» ادغام و حذف شود؟ همهٔ کتاب‌های آن به «${authorName.value}» منتقل می‌شوند. این عملیات قابل بازگشت نیست.`
    )
  ) {
    return
  }
  loading.value = true
  const res = await fetch(
    `https://api.naskban.ir/api/pdf/author/merge/${route.params.id}/${duplicate.id}`,
    {
      method: 'PUT',
      headers: {
        authorization: 'bearer ' + userInfo.value.token,
        'content-type': 'application/json'
      }
    }
  )
  loading.value = false
  if (!res.ok) {
    alert(await res.json())
    return
  }
  alert('ادغام با موفقیت انجام شد!')
  await loadBooks()
}

async function deleteAuthor() {
  if (
    !confirm(
      `پدیدآورندهٔ «${authorName.value}» حذف شود؟ این پدیدآورنده دیگر در فهرست یا جست‌وجوی پدیدآورندگان نخواهد بود، اما نامش همچنان در قسمت پدیدآورندگان کتاب‌هایی که به آن اشاره دارند باقی می‌ماند. این عملیات قابل بازگشت نیست.`
    )
  ) {
    return
  }
  loading.value = true
  const res = await fetch(`https://api.naskban.ir/api/pdf/author/${route.params.id}`, {
    method: 'DELETE',
    headers: {
      authorization: 'bearer ' + userInfo.value.token,
      'content-type': 'application/json'
    }
  })
  loading.value = false
  if (!res.ok) {
    alert(await res.json())
    return
  }
  // the author this screen was showing no longer exists - same reasoning as
  // deletePDFBook's own navigation elsewhere: staying here would just leave a
  // stale/broken page
  goTo('/authors')
}

watch(pageNumber, () => loadBooks())

onMounted(() => {
  if (localStorage.getItem('userInfo')) {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('userInfo'))
    } catch {
      userInfo.value = null
    }
  }
  loadAuthorName()
  loadBooks()
  loadPinned()
  canDelete.value = checkPermission('pdf', 'delete')
})

function goTo(url) {
  window.location.href = url
}
</script>

<template>
  <q-bar class="flex-center">
    <div class="q-pa-lg flex flex-center">
      <q-btn dense flat icon="arrow_forward" class="green" @click="goTo('/authors')">
        <q-tooltip class="bg-green text-white">بازگشت به پدیدآورندگان</q-tooltip>
      </q-btn>
      <q-separator vertical inset spaced v-if="userInfo != null" />
      <q-btn
        v-if="userInfo != null"
        dense
        flat
        icon="push_pin"
        :color="pinned ? 'green' : 'grey-5'"
        @click="togglePin"
      >
        <q-tooltip class="bg-green text-white">
          {{ pinned ? 'حذف سنجاق این پدیدآورنده' : 'سنجاق کردن این پدیدآورنده' }}
        </q-tooltip>
      </q-btn>
      <q-btn
        v-if="canDelete"
        dense
        flat
        icon="merge_type"
        class="green"
        @click="mergeAuthorDialogOpen = true"
      >
        <q-tooltip class="bg-green text-white">ادغام با پدیدآورندهٔ دیگر</q-tooltip>
      </q-btn>
      <q-btn
        v-if="canDelete"
        dense
        flat
        icon="delete_outline"
        class="green"
        @click="deleteAuthor"
      >
        <q-tooltip class="bg-green text-white">حذف پدیدآورنده</q-tooltip>
      </q-btn>
    </div>
  </q-bar>

  <AuthorPickerDialog
    v-model="mergeAuthorDialogOpen"
    title="ادغام با پدیدآورندهٔ دیگر"
    :exclude-author-id="route.params.id"
    @picked="onDuplicateAuthorPicked"
  />

  <h3 v-if="authorName">{{ authorName }}</h3>

  <div class="row justify-center q-pa-sm">
    <q-chip
      clickable
      :outline="selectedRole !== null"
      color="green"
      text-color="white"
      @click="selectRole(null)"
    >
      همه
    </q-chip>
    <q-chip
      v-for="role in authorRoles"
      :key="role"
      clickable
      :outline="selectedRole !== role"
      color="green"
      text-color="white"
      @click="selectRole(role)"
    >
      {{ role }}
    </q-chip>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
  </div>

  <div class="row justify-center" v-if="!loading">
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
      <q-card class="cursor-pointer fit">
        <a :href="'/' + pdf.id">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="max-width: 200px; max-height: 300px"
            class="rounded-borders"
          >
          </q-img>
        </a>
        <q-card-section class="text-h6 book-info">
          <a :href="'/' + pdf.id" class="book-title">{{ pdf.title }} </a>
        </q-card-section>
        <q-card-section v-if="canDelete" class="flex flex-center">
          <q-btn label="حذف کتاب" @click="deletePDFBook(pdf.id, pdf.title)" />
          <q-btn
            label="ادغام کتاب"
            class="q-ml-sm"
            @click="mergePDFBook(pdf.id, pdf.title)"
          />
        </q-card-section>
      </q-card>
    </div>
    <div v-if="pdfs.length === 0" class="text-center full-width q-pa-lg">
      کتابی از این پدیدآورنده یافت نشد.
    </div>
  </div>

  <div class="q-pa-lg flex flex-center">
    <q-pagination
      v-model="pageNumber"
      v-if="!loading && pageCount > 1"
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
</template>

<style>
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
