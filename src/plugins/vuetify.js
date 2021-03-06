import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export const themeLight = {
  primary: '#ff8822',
  secondary: '#424242',
  anchor: 'red',
  accent: '#82B1FF',
  error: '#FF5252',
  info: '#2196F3',
  success: '#4CAF50',
  warning: '#FFC107'
};

export default new Vuetify({
  theme: {
    themes: {
      light: themeLight
    }
  }
});
