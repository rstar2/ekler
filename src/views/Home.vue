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
    ...mapGetters(['authId', 'getEklers']),
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
      // skip if not logged in
      if (!this.authId) return;

      const userId = user.id;
      // skip if "owner" logged in user
      if (userId === this.authId) return;

      const ownerToUser = this.getEklers(this.authId, userId);
      if (ownerToUser) {
        // you own eklers to this user
        console.log('You own', ownerToUser.eklers, 'eklers to', userId);
        return;
      }

      const userToOwner = this.getEklers(userId, this.authId);
      if (userToOwner) {
        console.log(userId, 'owes you', userToOwner.eklers, 'eklers');
        return;
      }
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
