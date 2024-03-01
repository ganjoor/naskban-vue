<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  document.title = 'نسک‌بان - معرفی'
})
</script>
<template>
  <div class="flex flex-center">
    <q-card class="q-pa-md shadow-2 login-card" bordered>
      <div class="text-grey-9 text-h5 text-weight-bold text-center">معرفی نسک‌بان</div>
      <q-card-section>
        <p>
          نسک‌بان یک کتابخانه از فایل‌های PDF کتاب‌های فارسی است که امکان جستجو در متن آنها وجود
          دارد.
        </p>
        <p>
          در حال حاضر همهٔ کتاب‌های آن از
          <a href="https://sohalibrary.com" target="_blank">سها</a> دریافت شده‌اند.
        </p>
        <p>
          در نسک‌بان فعالیت‌های کاربر شامل کتاب‌ها و صفحات کتاب‌های مشاهده شده با مقاصد آماری ذخیره
          و به شکل تجمیعی رصد می‌شود. تاریخچه و کتاب‌ها و صفحات نشان‌شدهٔ کاربر خصوصی هستند و فقط به
          خود او نمایش داده می‌شوند.
        </p>
        <p>
          کاربر می‌تواند هر زمان که اراده کند حساب کاربری خود را پاک کند. با پاک شدن حساب کاربری،
          آمار بازدیدهای یک کاربر بی‌نام می‌شوند و سایر اطلاعات خصوصی او پاک می‌شود.
        </p>
        <p>
          نسک‌بان در حال حاضر توسط یک شخص نگهداری می‌شود و اطلاعات کاربران آن در اختیار هیچ سازمانی
          قرار نمی‌گیرد. این شخص حق پایان دادن به فعالیت نسک‌بان را در موقعیت‌هایی که به هر دلیلی
          معذوریتی ایجاد شود برای خود محفوظ می‌داند.
        </p>
        <p>
          برای آشنایی با امکانات نسک‌بان
          <a href="https://blog.ganjoor.net/?p=2840" target="_blank">اینجا</a> را ببینید.
        </p>
        <p>
          در صورت نیاز به تماس با نسک‌بان
          <a href="https://ganjoor.net/contact" target="_blank">این صفحه</a> را ببینید.
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>
<style scoped>
header {
  margin: auto;
  text-align: center;
}
h1 {
  font-size: 3em;
}
.wrapper {
  margin: auto;
}

.logo {
  display: block;
  margin: auto;
}
</style>
