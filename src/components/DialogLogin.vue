<template>
  <v-dialog v-model="active" max-width="450">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-row wrap>
            <v-form ref="form" v-model="valid">
              <v-col xs12>
                <v-text-field
                  label="Email*"
                  v-model="user.email"
                  :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid email']"
                  @keydown.enter="disabled ? void 0 : doAction()"
                  data-testid="in-email"
                ></v-text-field>
              </v-col>

              <v-col xs12 v-if="isRegister">
                <v-text-field
                  label="Name*"
                  v-model="user.name"
                  :rules="[
                    v => !!v || 'Name is required',
                    v => (v && v.length >= 5) || 'Name must have at least 5 letters'
                  ]"
                  data-testid="in-name"
                ></v-text-field>
              </v-col>

              <v-col xs12>
                <v-text-field
                  type="password"
                  label="Password*"
                  v-model="user.password"
                  :rules="[
                    v => !!v || 'Password is required',
                    v => (v && v.length >= 5) || 'Password must have at least 5 letters'
                  ]"
                  @keydown.enter="disabled ? void 0 : doAction()"
                  data-testid="in-password"
                ></v-text-field>
              </v-col>
            </v-form>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <!-- Move the buttons to the right -->
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="active = false">Close</v-btn>
        <v-btn color="green darken-1" text @click="doAction" :disabled="disabled" data-testid="btn-action">{{
          action
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      required: true
    },
    isRegister: {
      type: Boolean,
      required: true
    }
  },
  // use the 'show' property for v-model
  model: {
    prop: 'show',
    event: 'close'
  },
  data() {
    return {
      valid: false,
      user: {
        email: null,
        name: null,
        password: null
      }
    };
  },
  computed: {
    active: {
      get() {
        return this.show;
      },
      set(isActive) {
        if (!isActive) {
          // reset the form's validation
          this.$refs.form.reset();
          //   this.$refs.form.resetValidation();
        }
        this.$emit('close', isActive);
      }
    },
    title() {
      return this.isRegister ? 'Auth register' : 'Auth login';
    },
    action() {
      return this.isRegister ? 'Sign up' : 'Sign in';
    },
    disabled() {
      return !this.valid;
    }
  },
  methods: {
    doAction() {
      if (!this.$refs.form.validate()) return;

      this.$emit('action', { ...this.user, isRegister: this.isRegister });

      // close the dialog
      this.active = false;
    }
  }
};
</script>
