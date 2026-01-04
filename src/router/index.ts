import { createRouter, createWebHistory } from 'vue-router'
import TournamentListView from '../views/TournamentListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'tournaments',
      component: TournamentListView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/AuthLoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/AuthRegisterView.vue'),
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/VerifyEmailView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/tournaments/new',
      name: 'tournament-create',
      component: () => import('../views/TournamentFormView.vue'),
    },
    {
      path: '/tournaments/:id/edit',
      name: 'tournament-edit',
      component: () => import('../views/TournamentFormView.vue'),
      props: true,
    },
    {
      path: '/tournaments/:id',
      name: 'tournament-detail',
      component: () => import('../views/TournamentDetailView.vue'),
      props: true,
    },
    {
      path: '/tournaments/:id/join',
      name: 'tournament-join',
      component: () => import('../views/TournamentJoinView.vue'),
      props: true,
    },
    {
      path: '/tournaments/:id/teams',
      name: 'tournament-teams-review',
      component: () => import('../views/TournamentTeamsReviewView.vue'),
      props: true,
    },
    {
      path: '/tournaments/:id/schedule',
      name: 'tournament-schedule',
      component: () => import('../views/TournamentScheduleView.vue'),
      props: true,
    },
    {
      path: '/tournaments/:id/bracket',
      name: 'tournament-bracket',
      component: () => import('../views/TournamentBracketView.vue'),
      props: true,
    },
    {
      path: '/teams/:id',
      name: 'team-detail',
      component: () => import('../views/TeamDetailView.vue'),
      props: true,
    },
    {
      path: '/teams/new',
      name: 'team-create',
      component: () => import('../views/TeamCreateView.vue'),
    },
    {
      path: '/teams/:id/manage',
      name: 'team-manage',
      component: () => import('../views/TeamManageView.vue'),
      props: true,
    },
    {
      path: '/teams/:id/history',
      name: 'team-history',
      component: () => import('../views/InvitationHistoryView.vue'),
      props: true,
    },
  ],
})

export default router
