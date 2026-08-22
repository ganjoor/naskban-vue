import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ItemView from './views/ItemView.vue'
import PageView from './views/PageView.vue'
import LoginView from './views/LoginView.vue'
import SignupView from './views/SignupView.vue'
import GanjoorFrame from './views/GanjoorFrame.vue'
import GanjoorReview from './views/GanjoorReview.vue'
import SearchText from './views/SearchText.vue'
import BookmarksView from './views/BookmarksView.vue'
import ProfileView from './views/ProfileView.vue'
import ResetPassword from './views/ResetPassword.vue'
import VisitTracks from './views/VisitTracks.vue'
import AboutPage from './views/AboutPage.vue'
import ShelvesView from './views/ShelvesView.vue'
import ShelfDetailView from './views/ShelfDetailView.vue'
import AuthorsView from './views/AuthorsView.vue'
import AuthorBooksView from './views/AuthorBooksView.vue'
import PDFBookReportsView from './views/PDFBookReportsView.vue'
import NotificationsView from './views/NotificationsView.vue'
import PDFBookCommentsHubView from './views/PDFBookCommentsHubView.vue'
import CommentsHubView from './views/CommentsHubView.vue'

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
      component: PageView
    },
    {
      path: '/frame/:id/:page',
      name: 'pdfframe',
      component: PageView
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
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/password',
      name: 'password',
      component: ResetPassword
    },
    {
      path: '/visits',
      name: 'visits',
      component: VisitTracks
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage
    },
    {
      path: '/shelves',
      name: 'shelves',
      component: ShelvesView
    },
    {
      path: '/shelves/:id',
      name: 'shelfdetail',
      component: ShelfDetailView
    },
    {
      path: '/authors',
      name: 'authors',
      component: AuthorsView
    },
    {
      path: '/authors/:id',
      name: 'authorbooks',
      component: AuthorBooksView
    },
    {
      path: '/reports',
      name: 'bookreports',
      component: PDFBookReportsView
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: NotificationsView
    },
    {
      path: '/comments',
      name: 'commentshub',
      component: CommentsHubView
    },
    {
      path: '/comments/:id',
      name: 'bookcommentshub',
      component: PDFBookCommentsHubView
    },
  ]
})

export default router
