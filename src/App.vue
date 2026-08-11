<template>
  <header v-if="$route.name != 'ganjoor' && $route.name != 'pdfframe'">
    <a href="/">
      <img
        alt="نسکبان"
        class="logo"
        src="@/assets/logo.svg"
        width="125"
        height="125"
      />
    </a>

    <div class="wrapper">
      <a href="/">
        <h1 class="green">نسکبان</h1>
      </a>
    </div>
  </header>

  <RouterView />

  <a href="https://myket.ir/app/ir.naskban.app">
    <img
      alt="نسکبان برای اندروید"
      class="android-logo"
      src="@/assets/app.png"
    />
  </a>
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

.android-logo {
  display: block;
  width: 75%;
  max-width: 1280px;
  height: auto;
  margin: 0 auto;
}
</style>