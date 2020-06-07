import Vue from 'vue';

import logger from '../lib/logger';

// attach the logger to all Vue components
Vue.prototype.$logger = logger;
