<template>
  <v-snackbar v-model="active" :color="color" :timeout="confirm.timeout" bottom right>
    <v-btn
      color="success"
      elevation="4"
      @click="
        confirmed = true;
        active = false;
      "
      >{{ confirm.text }}</v-btn
    >
  </v-snackbar>
</template>

<script>
import { notificationsBus } from './index';

export default {
  data() {
    // NOTE: Currently it's designed to show only one confirmation,
    // if necessary can be made to support multiple
    return {
      confirm: {
        text: null,
        callback: null,
        timeout: -1
      },
      confirmed: false,
      color: 'info' // 'cyan darken-2'
    };
  },
  computed: {
    active: {
      // getter
      get: function() {
        return !!this.confirm.text;
      },
      // setter
      set: function(newValue) {
        if (!newValue) {
          this.confirm.text = null;
          // notify the confirmation callback
          this.confirm.callback(this.confirmed);
          // clear for next usage
          this.confirmed = false;
        }
      }
    }
  },
  mounted() {
    /**
     *@param {{text: String, callback: Function, timeout?: Number}} confirm
     */
    notificationsBus.$on('confirm', confirm => {
      this.confirm = confirm;

      // 0 will keep it indefinately
      if (!confirm.timeout || confirm.timeout < 0) this.confirm.timeout = 0;
    });

    // example usage:
    // setTimeout(() => {
    //   this.$confirm({
    //     text: 'New content available. Refesh?',
    //     callback: ok => {
    //       console.log(ok ? 'Confirmed' : 'Rejected');
    //     }
    //     // timeout: 3000
    //   });
    // }, 1);
  }
};
</script>

<style scoped>
.v-snack__content .v-btn.v-btn {
  margin: 0;
}
</style>
