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

      <v-col>
        <span class="headline">Profile picture: </span>
        {{ authUser.photoURL || 'Not set' }}
        <v-btn
          text
          @click="
            dialogInput.for = 'JIRA Avatar OwnerID';
            dialogInput.show = true;
          "
        >
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

    <DialogInput
      v-model="dialogInput.show"
      :title="`Update ${dialogInput.for}`"
      :type="dialogInput.type"
      @action="onInput"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex';

import DialogInput from '../components/DialogInput.vue';

export default {
  components: { DialogInput },
  data() {
    return {
      dialogInput: {
        show: false,
        type: null,
        for: null
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
      } else if (this.dialogInput.for === 'JIRA Avatar OwnerID') {
        this.changeProfile({ photoURL: value });
      } else {
        throw new Error('Invald dialog input state');
      }
    },
    async changeProfile({ name, photoURL }) {
      try {
        // passing null will clear the display name
        // missing prop or undefined is just not chnaging it

        await this.$store.dispatch('updateProfile', { name, photoURL });
      } catch (error) {
        this.$notify({ text: error.message || 'Failed to update profile', type: 'error' });
      }
    },
    async changePassword(password) {
      try {
        await this.$store.dispatch('updatePassword', password);
      } catch (error) {
        this.$notify({ text: error.message || 'Failed to update the password', type: 'error' });
      }
    }
  }
};
</script>
