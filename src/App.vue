<template>
  <v-app>
    <!-- set progressbar -->
    <vue-progress-bar></vue-progress-bar>

    <v-app-bar app color="primary" dark>
      <Navbar />
    </v-app-bar>

    <v-content>
      <!-- <v-container fluid> -->

      <!-- Add a spinner until Firebase is "initialized" and user is known to be logged in or out -->
      <div v-if="!$store.state.authInitialized" class="d-flex justify-center align-center spinner">
        <Spinner :speed="1.0" :size="120" :line-size="15" :line-fg-color="$vuetify.theme.themes.light.primary" />
      </div>
      <template v-else>
        <v-fade-transition mode="out-in">
          <!-- Use keep-alive as the main views are not needed to be recreated each time -->
          <keep-alive>
            <router-view />
          </keep-alive>
        </v-fade-transition>
      </template>

      <!-- </v-container> -->

      <!--  These components are necessary for the notifications/confirmations plugin to work -->
      <Notifications />
      <Confirmations />
    </v-content>
  </v-app>
</template>

<script>
import Spinner from 'vue-simple-spinner';

// @ is an alias to /src
import Navbar from '@/components/Navbar.vue';

// Use/implement the 'plugins/handler'
function initStoreHandler(store, topProgress, notify) {
  let countPending = 0;
  /**
   *
   * @param {String} type
   */
  store.handler.onStart = (type /* , ...params */) => {
    console.log(`Action start: '${type}'`);

    // notify({ type: 'info', text: `Start ${type}` });

    countPending++;

    // if this is first action start the top progress
    if (countPending === 1) topProgress.start();
  };

  /**
   *
   * @param {*} result
   * @param {String} type
   */
  store.handler.onSuccess = (result, type /* , ...params */) => {
    console.log(`Action succeeded: '${type}' with result: ${result}`);

    onEnd();

    return result;
  };

  /**
   *
   * @param {Error} error
   * @param {String} type
   */
  store.handler.onFailure = (error, type /* , ...params */) => {
    console.error(`Action failed: '${type}' with error: ${error.message}`);
    console.error(error);

    notify({ type: 'error', text: `Failed ${type}` });

    onEnd(true);

    throw error;
  };

  /**
   * @param {Boolean} [isFailed]
   */
  const onEnd = (isFailed = false) => {
    countPending--;
    if (countPending < 0) {
      console.error('Hmmm, more than the needed pending actions are "finished"');
      countPending = 0;
    }
    // stop the top propresss if this was the last one
    if (countPending === 0) {
      if (isFailed) topProgress.fail();
      else topProgress.finish();
    }
  };
}

export default {
  name: 'App',
  components: {
    Spinner,
    Navbar
  },

  data: () => ({
    // no data
  }),
  created() {
    initStoreHandler(this.$store, this.$topProgress, this.$notify);
  }
};
</script>
<style scoped>
.spinner {
  height: 100%;
}
</style>
