//  main source taken from https://github.com/VitorLuizC/vuex-handler

/**
 * Install this plugin on Vuex.Store.
 * @example ```js
 * new Vuex.Store({ plugins: [ handler ], ... })
 * ```
 * @param {Vuex.Store} store
 */
const install = store => {
  const original = store.dispatch;

  store.handler = {};

  store.dispatch = (type, ...params) => {
    const specific = store.handler[type] || {};
    const onStart = specific.onStart || store.handler.onStart;
    const onFailure = specific.onFailure || store.handler.onFailure;
    const onSuccess = specific.onSuccess || store.handler.onSuccess;

    // call the 'onAction' action
    onStart && onStart(type, ...params);

    // dispatch the action
    const action = original.apply(store, [type, ...params]);

    // handle the result - success or failure
    action
      .then(result => Promise.resolve(onSuccess ? onSuccess(result, type, ...params) : result))
      .catch(error => Promise.resolve(onFailure ? onFailure(error, type, ...params) : Promise.reject(error)));

    return action;
  };
};

export default install;
