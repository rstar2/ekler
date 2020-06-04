<template>
  <v-snackbar v-model="active" :timeout="info.timeout">
    <span>{{ info.text }}</span>
    <v-btn class="red--text" text @click="active = false">Dismiss</v-btn>
  </v-snackbar>
</template>

<script>
import { notificationsBus } from './index';

export default {
  data() {
    // NOTE: Currently it's designed to show only one info-notification,
    // if necessary can be made to support multiple
    return {
      info: {
        text: null,
        type: null,
        timeout: 0
      }
    };
  },
  computed: {
    active: {
      // getter
      get: function() {
        return !!this.info.text;
      },
      // setter
      set: function(newValue) {
        if (!newValue) {
          this.info.text = null;
        }
      }
    }
  },
  mounted() {
    /**
     * @param {{text: String, type: String, timeout: Number}} info
     */
    notificationsBus.$on('info', info => {
      this.info = info;
    });

    // example usage:
    // setTimeout(() => {
    //   this.$notify({ text: 'Hi', type: 'error' });
    // }, 3000);
  }
};
</script>
