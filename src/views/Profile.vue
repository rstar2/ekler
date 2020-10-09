<template>
  <v-container class="profile">
    <v-row v-if="authUser" class="flex-column">
      <v-col><span class="headline">Email: </span>{{ authUser.email }}</v-col>

      <v-col>
        <span class="headline">Name: </span>
        {{ authUser.name || '"Not set"' }}
        <v-btn
          text
          @click="
            dialogInput.for = 'Name';
            dialogInput.show = true;
          "
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-col>

      <v-col class="avatarInfo">
        <span class="headline">Avatar: </span>
        <img v-if="authUser.photoURL" :src="authUser.photoURL" :width="avatarWidth" :height="avatarHeigth" />
        <span v-else>Not set</span>
        <v-btn text @click="dialogAvatar.show = true">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-col>

      <v-col class="d-flex justify-end">
        <v-btn
          color="blue darken-1"
          text
          @click="
            dialogInput.for = 'Password';
            dialogInput.type = 'password';
            dialogInput.show = true;
          "
          >Update Password</v-btn
        >
      </v-col>
    </v-row>

    <!-- Common unout dialog - for name or password -->
    <DialogInput
      v-model="dialogInput.show"
      :title="`Update ${dialogInput.for}`"
      :type="dialogInput.type"
      @action="onInput"
    />

    <!-- The Update Avatar dialog -->
    <DialogUpdateAvatar
      v-model="dialogAvatar.show"
      :activator="$refs.dlgActivatorAvatar"
      :user="authUser"
      @update="onAvatarUpdate"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex';

import * as avatars from '@/services/avatars';

import DialogInput from '../components/DialogInput.vue';
import DialogUpdateAvatar from '../components/DialogUpdateAvatar.vue';

export default {
  components: { DialogInput, DialogUpdateAvatar },
  data() {
    return {
      dialogInput: {
        show: false,
        type: null,
        for: null
      },

      dialogAvatar: {
        show: false
      }
    };
  },
  computed: {
    ...mapState(['authUser'])
  },
  watch: {
    'dialogInput.show': {
      handler(value) {
        // on close just reset other dialog props
        if (!value) {
          this.dialogInput.for = null;
          this.dialogInput.type = null;
        }
      }
    }
  },
  methods: {
    /**
     * Called when selected value from the DialogInput
     * @param {String} value
     */
    onInput(value) {
      if (this.dialogInput.for === 'Name') {
        this.changeProfile({ name: value });
      } else if (this.dialogInput.for === 'Password') {
        this.changePassword(value);
      } else {
        throw new Error('Invald dialog input state');
      }
    },

    /**
     * @param {{ name?: String, photoURL?: String }} profile
     */
    async changeProfile(profile) {
      try {
        // passing null will clear the display name
        // missing prop or undefined is just not chnaging it

        await this.$store.dispatch('updateProfile', profile);
      } catch (error) {
        this.$notify({ text: error.message || 'Failed to update profile', type: 'error' });
      }
    },

    /**
     * @param {String} password
     */
    async changePassword(password) {
      try {
        await this.$store.dispatch('updatePassword', password);
      } catch (error) {
        this.$notify({ text: error.message || 'Failed to update the password', type: 'error' });
      }
    },

    /**
     * @param {File|null} avatarData the new user's avatar, or null if avatar is removed
     */
    onAvatarUpdate({ avatarData }) {
      // set/remove in Firebase
      avatars
        .uploadAvatar(this.authUser, avatarData)
        // update the Firbase Auth-User and DB (the users collection) - this will trigger realtime update in the UI
        .then(avatarURL => this.changeProfile({ photoURL: avatarURL }))
        .then(() => this.$notify({ text: 'Updated the avatar' }))
        .catch(error => this.$notify({ text: error.message || 'Failed to update the avatar', type: 'error' }));
    }
  }
};
</script>

<style lang="scss" scoped>
.avatarInfo {
  span,
  .v-btn {
    vertical-align: top;
  }
  img {
    border-radius: 50%;
    width: 100px;
    height: 100px;
  }
}
</style>
