import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import History from '../views/History.vue';

import store from '../store/index';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    // a meta field
    meta: { requiresUsers: true }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    // a meta field
    meta: { requiresUsers: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    // a meta field
    meta: { requiresAuth: true },
    // route level code-splitting
    // this generates a separate chunk (profile.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "profile" */ '../views/Profile.vue')
  }
];

/**
 * @param {VueRouter.Route} route
 * @return {Boolean}
 */
const requiresAuth = route => route.matched.some(record => record.meta && record.meta.requiresAuth);

/**
 * @param {VueRouter.Route} route
 * @return {Boolean}
 */
const requiresUsers = route => route.matched.some(record => record.meta && record.meta.requiresUsers);

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

router.beforeEach((to, from, next) => {
  // TODO: make it work if meta is {requiresAuth: true, requiresWorkspace: true}
  // then both requirements  should be should be checked and met

  if (requiresAuth(to)) {
    // this route requires auth, check if logged in
    // if not, redirect to login page.
    if (!store.getters.isAuth) {
      next({
        path: '/'
        // query: { redirect: to.fullPath }
      });
    } else {
      next(); // already authorized
    }
  } else if (requiresUsers(to)) {
    if (!store.state.usersLoaded) store.dispatch('usersLoad').finally(next);
    else next(); //already users are loaded
  } else {
    next(); // make sure to always call next()!
  }
});

// watch if we are no more 'authorized' while we are in a route that requires it
store.watch(
  (state, getters) => getters.isAuth, // watch for change in 'isAuth'

  // (newValue, oldValue)
  isAuth => {
    // Do whatever makes sense now
    if (!isAuth && requiresAuth(router.currentRoute)) {
      // go back to home
      router.replace('/');
    }
  }
);

export default router;
