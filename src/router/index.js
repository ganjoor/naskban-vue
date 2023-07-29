import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ItemView from '../views/ItemView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/:id',
      name: 'view',
      component: ItemView
    },
    {
      path: '/p/:page',
      name: 'page',
      component: HomeView
    },
  ]
})

export default router
