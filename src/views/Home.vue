<template>
  <v-container class="home">
    <Eklers v-if="users" :users="users" :authUserId="authId" :eklers="eklers" @userClick="onUserClick" />

    <v-fab-transition>
      <v-btn v-show="authId" ref="dlgActivator" absolute dark fab bottom right color="primary" class="v-btn--addEklers">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>

    <DialogAddEklers :users="toUsers" :activator="$refs.dlgActivator" @action="onAddEklers" />
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import Eklers from '@/components/Eklers.vue';
import DialogAddEklers from '@/components/DialogAddEklers.vue';

export default {
  name: 'Home',
  components: {
    Eklers,
    DialogAddEklers
  },
  data() {
    return {
      dialog: false
    };
  },
  computed: {
    ...mapState(['users', 'eklers']),
    ...mapGetters(['authId']),
    toUsers() {
      let toUsers = this.users;
      // filter the current/owner user
      if (this.authId) toUsers = toUsers.filter(user => user.id !== this.authId);
      return toUsers;
    }
  },
  mounted() {
    this.$store.dispatch('eklersLoad');
  },
  methods: {
    onAddEklers({ to, count }) {
      const from = this.authId;
      this.$store.dispatch('eklersAdd', { from, to, count });
    },
    onUserClick(user) {
      console.log(user);
    }
  }
};
</script>

<style scoped>
.v-btn--addEklers {
  position: absolute;
  /* !important is to overwrite the vuetify CSS that have higher specificity */
  bottom: 0 !important;
  margin: 0 0 16px 16px;
}
</style>
