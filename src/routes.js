import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ItemView from './views/ItemView.vue'
import PDFView from './views/PDFView.vue'
import LoginView from './views/LoginView.vue'
import SignupView from './views/SignupView.vue'
import GanjoorFrame from './views/GanjoorFrame.vue'
import GanjoorReview from './views/GanjoorReview.vue'
import SearchText from './views/SearchText.vue'
import BookmarksView from './views/BookmarksView.vue'

export const routes = createRouter({
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
      path: '/frame/:id/:page',
      name: 'pdfframe',
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
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/ganjoor',
      name: 'ganjoor',
      component: GanjoorFrame
    },
    {
      path: '/review',
      name: 'review',
      component: GanjoorReview
    },
    {
      path: '/text',
      name: 'text',
      component: SearchText
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: BookmarksView
    }
  ]
})

export default routes
