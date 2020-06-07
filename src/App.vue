<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <Navbar />
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <v-fade-transition mode="out-in">
          <router-view />
        </v-fade-transition>
      </v-container>

      <!--  These components are necessary for the notifications/confirmations plugin to work -->
      <Notifications />
      <Confirmations />
    </v-content>
  </v-app>
</template>

<script>
// @ is an alias to /src
import Navbar from '@/components/Navbar.vue';

export default {
  name: 'App',
  components: {
    Navbar
  },

  data: () => ({
    // no data
  })
};
</script>
