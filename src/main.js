import './assets/Vazirmatn-UI-FD-font-face.css'

import { createApp } from 'vue'
import { Quasar, Dark } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './assets/main.css'

import App from './App.vue'
import {router} from './router'
import TrackingPlugin from './plugins/tracking'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
    plugins: { Dark }, // import Quasar plugins and add here
  })

  app.use(TrackingPlugin, {
    siteId: "3", 
    debug: true, 
    router: router // Pass the router instance
  })

app.mount('#app')
