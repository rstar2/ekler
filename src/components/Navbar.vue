<template>
  <!-- Make it a nav tag -->
  <v-row tag="nav">
    <div class="d-flex align-center">
      <v-img
        alt="Vuetify Logo"
        class="shrink"
        contain
        src="../assets/logo.png"
        transition="scale-transition"
        width="40"
      />
    </div>

    <router-link to="/" class="mr-2 pa-1">Home</router-link>
    <router-link to="/history" class="mx-2 pa-1">History</router-link>
    <router-link v-if="isAuth" to="/profile" class="ml-2 pa-1">Profile</router-link>

    <v-spacer></v-spacer>

    <template v-if="authInitialized">
      <v-btn v-if="isAuth" text @click="onLogout">
        <span class="mr-2">Logout</span>
        <v-icon>mdi-logout</v-icon>
      </v-btn>
      <template v-else>
        <v-btn text @click="showDialogLogin(false)">
          <span class="mr-2">Login</span>
          <v-icon>mdi-open-in-new</v-icon>
        </v-btn>
        <v-btn text @click="showDialogLogin(true)">
          <span class="mr-2">Register</span>
          <v-icon>mdi-account-plus-outline</v-icon>
        </v-btn>
      </template>
    </template>

    <!--
      The .sync modifier can also be used with v-bind
      when using an object to set multiple props at once:

      <text-document v-bind.sync="doc"></text-document>
      This passes each property in the doc object (e.g. title) as an individual prop,
      then adds v-on update listeners for each one.
      -->
    <DialogLogin v-model="dialogLogin.show" :isRegister="dialogLogin.isRegister" @action="onLoginOrRegister" />
  </v-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import DialogLogin from './DialogLogin.vue';

export default {
  components: { DialogLogin },
  data() {
    return {
      dialogLogin: {
        show: false,
        isRegister: false
      }
    };
  },
  computed: {
    ...mapGetters(['isAuth']),
    ...mapState(['authInitialized', 'authUser'])
  },
  methods: {
    showDialogLogin(isRegister) {
      this.dialogLogin.show = true;
      this.dialogLogin.isRegister = isRegister;
    },
    onLoginOrRegister({ isRegister, email, name, password }) {
      // bus.$emit('loading', true);
      let promise;
      if (isRegister) {
        promise = this.$store
          .dispatch('register', { email, name, password })
          .then(() => this.$notify({ text: 'Verification email is sent' }));
      } else {
        promise = this.$store.dispatch('login', { email, password });
      }
      promise
        .catch(error => {
          // const errorCode = error.code;
          const errorMessage = error.message;
          this.$logger.warn(errorMessage);
          this.$notify({ text: errorMessage, type: 'error' });
        })
        .finally(() => {
          // bus.$emit('loading', false)
        });
    },
    onLogout() {
      // bus.$emit('loading', true);
      this.$store
        .dispatch('logout', {})
        .catch(error => {
          // const errorCode = error.code;
          const errorMessage = error.message;
          this.$logger.warn(errorMessage);
          this.$notify({ text: errorMessage, type: 'error' });
        })
        .finally(() => {
          // bus.$emit('loading', false)
        });
    }
  }
};
</script>

<style scoped>
nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
