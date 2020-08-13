import Vue from 'vue';

import App from './App.vue';
import router from './router';
import store from './store';

import vuetify from './plugins/vuetify';
import './plugins/logger';
import './plugins/notifications';
import './plugins/top-progress';

import './registerServiceWorker';

Vue.config.productionTip = false;

export default new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
