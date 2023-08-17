import './assets/Vazirmatn-UI-FD-font-face.css'

import { createApp } from 'vue'
import { Quasar } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './assets/main.css'

import App from './App.vue'
import {routes} from './routes'

const app = createApp(App)

app.use(routes)
app.use(Quasar, {
    plugins: {}, // import Quasar plugins and add here
  })

app.mount('#app')
