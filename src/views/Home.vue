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
      <v-btn v-show="authId" ref="dlgActivator" fixed dark fab bottom right color="primary" class="v-btn--addEklers">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>

    <DialogAddEklers :users="toUsers" :activator="$refs.dlgActivator" @action="onAddEklers" />

    <!-- notification:
     1. for how many eklers you owe someone else
     2. if you already requested/checkouted the other user that owes you eklers
    -->
    <DialogNotification v-model="notification" :title="notificationTitle" />

    <!-- confirmation for :
       1. if you want to requested/checkouted the other user that owes you eklers
       2. if you already requested/checkouted the otherand he gave you the eklers (e.f. to unlock it)
    -->
    <DialogConfirmation
      :title="checkoutTitle"
      :text="checkoutMsg"
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

import { pluralize } from '../lib/util.js';

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
      notification: '',
      notificationTitle: '',

      checkout: {
        userId: null,
        eklers: 0,
        isAlready: false
      }
    };
  },
  computed: {
    ...mapState(['users', 'eklers', 'checkouts']),
    ...mapGetters(['authId', 'getEklers', 'getUserName']),
    toUsers() {
      let toUsers = this.users;
      // filter the current/owner user
      if (this.authId) toUsers = toUsers.filter(user => user.id !== this.authId);
      return toUsers;
    },
    checkoutTitle() {
      return this.checkout.isAlready ? 'Already requested' : 'Request';
    },
    checkoutMsg() {
      // this will close the dialog also
      if (!this.checkout.userId) return '';

      const count = this.checkout.eklers;
      const msg = `${this.getUserName(this.checkout.userId)} owes you ${count} ${pluralize(count, 'ekler')}.`;
      return this.checkout.isAlready ? `${msg} Did you get them?` : `${msg} Request them?`;
    }
  },
  mounted() {
    this.$store.dispatch('eklersLoad');
  },
  methods: {
    onAddEklers({ to, count }) {
      if (this.isBlocked(to)) {
        this.$notify({
          text: `User ${this.getUserName(to)} is blocked - needs to give requested eklers`,
          type: 'error'
        });
        return;
      }
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
        // you owe eklers to this user
        console.log('You owe', ownerToUser.eklers, 'eklers to', userId);
        // show a notification dialog
        const count = ownerToUser.eklers;
        this.notification = `You owe ${count} ${pluralize(count, 'ekler')} to ${this.getUserName(userId)}`;
        this.notificationTitle = 'You owe';
        return;
      }

      const userToOwner = this.getEklers(userId, this.authId);
      if (userToOwner) {
        console.log(userId, 'owes you', userToOwner.eklers, 'eklers');

        if (userToOwner.checkout) {
          // so user is already "checkout"-ed, so show confirmation message to unlock him
          this.checkout.isAlready = true;
          this.checkout.userId = userId;
          this.checkout.eklers = userToOwner.eklers;
        } /* else if (this.isBlocked(userId)) {
          // he/she is already blocked
          this.$notify({
            text: `User ${this.getUserName(userId)} is blocked - needs to give requested eklers`,
            type: 'error'
          });
        }  */ else {
          // show confirmation dialog to request the owed eklers
          this.checkout.isAlready = false;
          this.checkout.userId = userId;
          this.checkout.eklers = userToOwner.eklers;
        }
      }
    },

    doCheckoutConfirm() {
      this.$store.dispatch(this.checkout.isAlready ? 'eklersUnlock' : 'eklersCheckout', this.checkout.userId);
    }
  }
};
</script>

<style scoped>
.v-btn--addEklers {
  /* !important is to overwrite the vuetify CSS that have higher specificity */
  bottom: 0 !important;
  margin: 0 0 16px 16px;
}

.home {
  height: 100%;
  display: flex;
}
</style>
