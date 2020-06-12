<template>
  <v-container class="home">
    <Eklers v-if="users" :users="users" :authUserId="authId" :eklers="eklers" />
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import Eklers from '@/components/Eklers.vue';

export default {
  name: 'Home',
  components: {
    Eklers
  },
  computed: {
    ...mapState(['users', 'eklers']),
    ...mapGetters(['authId'])
  },
  mounted() {
    this.$store.dispatch('eklersLoad');
  }
};
</script>
