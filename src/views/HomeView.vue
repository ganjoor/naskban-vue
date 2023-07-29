<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const API_URL = `https://api.naskban.ir/api/pdf`
const route = useRoute()

const loading = ref(false)
const pageNumber = ref(null)
const pdfs = ref(null)
const pageCount = ref(1)

watchEffect(async () => {
  if (pageNumber.value == null) {
    if (route.params.page != null) {
      pageNumber.value = route.params.page
    } else {
      pageNumber.value = 1;
    }
  }
  const url = `${API_URL}?PageNumber=${pageNumber.value}&PageSize=20`
  loading.value = true;
  const res = await fetch(url);
  pdfs.value = await res.json();
  for (var pair of res.headers.entries()) {
   if(pair[0] == 'paging-headers'){
    const paging_headers = JSON.parse(pair[1]);
    pageCount.value = paging_headers.totalPages;

   }
}
  loading.value = false;
  if(pageNumber.value == 1){
    window.history.pushState({}, '', '/');
  }
  else{
    window.history.pushState({}, '', '/p/' + pageNumber.value.toString());
  }
  
})
</script>

<template>
  <h3>تازه‌ترین کتاب‌های افزوده شده</h3>

  <div class="q-pa-lg flex flex-center">
    <q-spinner-hourglass v-if="loading" color="green" size="4em" />
    <q-pagination
      v-model="pageNumber"
      v-if="!loading"
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

  <div class="row justify-center">
    <div class="pdf flex q-ma-sm" v-for="pdf in pdfs" :key="pdf.id">
      <a :href="'/' + pdf.id">
        <q-card class="fit">
          <q-img
            :src="pdf.extenalCoverImageUrl"
            spinner-color="white"
            style="width: 200px"
            class="rounded-borders"
          >
          </q-img>
          <q-card-section class="text-h6">
            <a :href="'/' + pdf.id">{{ pdf.title }} </a>
          </q-card-section>
          <q-card-section class="text-subtitle2" v-if="pdf.authorsLine.length > 1">
            {{ pdf.authorsLine }}
          </q-card-section>
        </q-card>
      </a>
    </div>
  </div>
</template>

<style>
a {
  text-decoration: none;
  color: #42b883;
}
.flex-container {
  display: flex;
  flex-wrap: wrap;
  align-content: center;
}
h3 {
  text-align: center;
}
.pdf {
  text-align: center;
  max-width: 200px;
}
</style>
