import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ItemView from '../views/ItemView.vue'
import PDFView from '../views/PDFView.vue'
import LoginView from '../views/LoginView.vue'
import GanjoorFrame from '../views/GanjoorFrame.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/:id',
      name: 'view',
      component: ItemView,
    },
    {
      path: '/:id/:page',
      name: 'pdf',
      component: PDFView
    },
    {
      path: '/p/:page',
      name: 'page',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/ganjoor',
      name: 'ganjoor',
      component: GanjoorFrame
    }
  ]
})

export default router
