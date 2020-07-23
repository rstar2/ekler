<template>
  <v-container class="home">
    <Eklers
      v-if="users"
      :users="users"
      :authUserId="authId"
      :eklers="eklers"
      :checkouts="checkouts"
      @userClick="onUserClick"
    />

    <v-fab-transition>
      <v-btn v-show="authId" ref="dlgActivator" absolute dark fab bottom right color="primary" class="v-btn--addEklers">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>

    <DialogAddEklers :users="toUsers" :activator="$refs.dlgActivator" @action="onAddEklers" />

    <DialogNotification v-model="ownerToUserMsg" title="You owe!!!" />
    <DialogConfirmation
      :text="userToOwnerMsg"
      title="Chekout"
      @close="checkout.userId = null"
      @confirm="doCheckoutConfirm()"
    />
  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import Eklers from '@/components/Eklers.vue';
import DialogAddEklers from '@/components/DialogAddEklers.vue';
import DialogNotification from '@/components/DialogNotification.vue';
import DialogConfirmation from '@/components/DialogConfirmation.vue';

export default {
  name: 'Home',
  components: {
    Eklers,
    DialogAddEklers,
    DialogNotification,
    DialogConfirmation
  },
  data() {
    return {
      ownerToUserMsg: '',
      checkout: {
        userId: null,
        eklers: 0
      }
    };
  },
  computed: {
    ...mapState(['users', 'eklers', 'checkouts']),
    ...mapGetters(['authId', 'getEklers']),
    toUsers() {
      let toUsers = this.users;
      // filter the current/owner user
      if (this.authId) toUsers = toUsers.filter(user => user.id !== this.authId);
      return toUsers;
    },
    userToOwnerMsg() {
      if (!this.checkout.userId) return '';

      return `${this.checkout.userId} owes you ${this.checkout.eklers} eklers`;
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
        // show a notification dialog
        this.ownerToUserMsg = `You own ${ownerToUser.eklers} eklers to ${userId}`;
        return;
      }

      const userToOwner = this.getEklers(userId, this.authId);
      if (userToOwner) {
        console.log(userId, 'owes you', userToOwner.eklers, 'eklers');
        this.checkout.userId = userId;
        this.checkout.eklers = userToOwner.eklers;
        return;
      }
    },

    doCheckoutConfirm() {
      this.$store.dispatch('eklersCheckout', this.checkout.userId);
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
