/* eslint-disable no-console */

const noop = () => {};

// if 'isDev' only allow logging
const isLog = process.env.NODE_ENV !== 'production' && process.env.VUE_APP_LOGGER !== 'false';

export default {
  info: isLog ? console.log : noop,
  warn: isLog ? console.warn : noop,
  error: isLog ? console.error : noop
};
