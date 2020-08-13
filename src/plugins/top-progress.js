import Vue from 'vue';

import VueProgressBar from 'vue-progressbar';

import { themeLight } from './vuetify';

const options = {
  location: 'top',
  thickness: '5px',
  transition: {
    speed: '0.2s',
    opacity: '0.6s',
    termination: 300
  },

  color: themeLight.success,
  failedColor: themeLight.error,

  autoRevert: true,
  autoFinish: true,
  inverse: false
};

Vue.use(VueProgressBar, options);

// don't like the "$Progress" property, so will add an alias "$topProgress"
Vue.prototype.$topProgress = Vue.prototype.$Progress;

// USAGE from a Vue component:
// this.$topProgress.start();
// this.$topProgress.fail();
// this.$topProgress.finish();
