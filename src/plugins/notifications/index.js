import Vue from 'vue';

import types from './types';
import Notifications from './Notifications.vue';
import Confirmations from './Confirmations.vue';

// some default options
const optionsDefaults = {
  notificationsName: 'Notifications',
  confirmationsName: 'Confirmations',
  type: types.TYPE_INFO,
  timeout: 3000
};

let installed = false;

export const notificationsBus = new Vue();

const plugin = {
  install(Vue, opts) {
    // just a precaution
    if (installed) {
      return;
    }
    installed = true;

    // Merge options argument into options defaults
    const options = { ...optionsDefaults, ...opts };

    Vue.component(options.notificationsName, Notifications);
    Vue.component(options.confirmationsName, Confirmations);

    // attach to all Vue components and as static method also

    /**
     * @param {{text: String, type?: String, timeout?: Number}} info
     */
    Vue.notify = Vue.prototype.$notify = info => {
      notificationsBus.$emit(
        'info',
        !info.type || !info.timeout
          ? { ...info, type: info.type || options.type, timeout: info.timeout || options.timeout }
          : info
      );
    };

    /**
     * @param {{text: String, callback: Function, timeout?: Number}} confirm
     * @return {Promise} if callback is passed always return resolved promise
     */
    Vue.confirm = Vue.prototype.$confirm = confirm => {
      // if callback is provided then use it and confirmation-response will be handle by it
      // otherwise assume that 'real' Promise style is required, so generate one
      if (confirm.callback) {
        notificationsBus.$emit('confirm', confirm);
        return Promise.resolve();
      } else {
        return new Promise((resolve, reject) => {
          notificationsBus.$emit('confirm', {
            ...confirm,
            callback(ok) {
              if (ok) resolve();
              else reject(new Error('Not confirmed'));
            }
          });
        });
      }
    };
  }
};
export default plugin;

// install the plugin right here
Vue.use(plugin);
