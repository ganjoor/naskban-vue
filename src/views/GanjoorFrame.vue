<script setup>
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const htmlSrc = ref('')
function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace)
}
function replaceArray(str, findSet, replace) {
  for (let i = 0; i < findSet.length; i++) {
    str = str.replace(new RegExp(findSet[i], 'g'), replace)
  }
  return str
}

watchEffect(async () => {
  const response = await await fetch(route.query.url, { headers: { 'content-type': 'text/plain' } })

  if (!response.ok) {
    alert(await response.json())
    return
  }

  var ganjoorSrc = await response.text()

  var cssKept = replaceArray(ganjoorSrc, ['/css/p8.css'], 'p8css')
  var replacedHtml = replaceArray(cssKept, ['href="/'], 'href="/ganjoor?url=https://ganjoor.net/')

  var replacedJsLinks = replaceArray(replacedHtml, ['src="/'], 'src="https://ganjoor.net/')

  htmlSrc.value = replaceArray(replacedJsLinks, ['p8css'], 'https://ganjoor.net/css/p8.css')

  var searchString = 'گنجور » '
  var postIdIndex = htmlSrc.value.indexOf(searchString)
  if (postIdIndex != -1) {
    postIdIndex += searchString.length
    var closingTitle = htmlSrc.value.indexOf('</title>', postIdIndex)
    if (closingTitle != -1) {
      var title = replaceAll(htmlSrc.value.substring(postIdIndex, closingTitle), '&raquo;', '»')
      localStorage.setItem('ganjoorPostTitle', title)
    }
  }

  searchString = 'id="post-'
  postIdIndex = htmlSrc.value.indexOf(searchString, postIdIndex)
  if (postIdIndex != -1) {
    postIdIndex += searchString.length
    var closingQuote = htmlSrc.value.indexOf('"', postIdIndex)
    if (closingQuote != -1) {
      var postId = htmlSrc.value.substring(postIdIndex, closingQuote)
      localStorage.setItem('ganjoorPostId', postId)
    }
  }
})
</script>
<template>
  <div v-html="htmlSrc"></div>
</template>
