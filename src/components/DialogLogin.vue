<template>
  <v-dialog v-model="active" max-width="450">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-layout wrap>
            <v-flex xs12>
              <v-text-field
                label="Email*"
                v-model="user.email"
                :errorMessages="validate('email')"
                @keydown.enter="disabled ? void 0 : doAction()"
                data-testid="in-email"
              ></v-text-field>
            </v-flex>

            <v-flex xs12 v-if="isRegister">
              <v-text-field
                label="Name*"
                v-model="user.name"
                :errorMessages="validate('name')"
                data-testid="in-name"
              ></v-text-field>
            </v-flex>

            <v-flex xs12>
              <v-text-field
                type="password"
                label="Password*"
                v-model="user.password"
                :errorMessages="validate('password')"
                @keydown.enter="disabled ? void 0 : doAction()"
                data-testid="in-password"
              ></v-text-field>
            </v-flex>
          </v-layout>
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
import { validationMixin } from 'vuelidate';
import { required, minLength, email } from 'vuelidate/lib/validators';

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
  // use the 'show' property for a v-model
  model: {
    prop: 'show',
    event: 'close'
  },
  data() {
    return {
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
        const isActive = this.show;

        // on active reset
        if (isActive) {
          // eslint-disable-next-line vue/no-side-effects-in-computed-properties
          this.user = {};
          this.$v.user.$reset();
        }

        return isActive;
      },
      set(isActive) {
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
      return false;
      // return this.$v.user.$invalid;
    }
  },
  methods: {
    doAction() {
      // validate first and if any invalid vField then return
      this.$v.user.$touch();

      if (this.$v.user.$invalid) {
        // validation errors are shown already when this.$v.user.$touch() is called
        return;
      }

      this.active = false;

      this.$emit('action', { ...this.user, isRegister: this.isRegister });
    },

    validate(fieldName) {
      const vField = this.$v.user[fieldName];
      // if not validation for this vField
      if (!vField) {
        return '';
      }
      // if the vField has no errors (note it can be invalid already but not dirty)
      if (!vField.$error) {
        return '';
      }

      // make dynamic by the vField
      const validationErrors = this.validationErrors.user[fieldName];

      const errorStr = validationErrors.checks
        .map(checkName => {
          if (!vField[checkName]) {
            // it's a method that accepts the vField params for each specific check
            const errorFn = validationErrors.errors[checkName];
            return errorFn(vField.$params[checkName]);
          }
        })
        .find(errorStr => !!errorStr); // get the first errorStr
      return errorStr || '';
    }
  },

  // Vuelidate integration
  mixins: [validationMixin],

  // validation schema can be a function
  // which will make it dynamic and possibly dependant on your model's data.
  // this method will be called each time the model's data is changed
  validations() {
    // common for login/register
    const user = {
      email: {
        required,
        email
      },
      password: {
        required,
        minLength: minLength(5)
      },

      name: {}
    };

    // only for register
    if (this.isRegister) {
      Object.assign(user, {
        name: {
          required,
          minLength: minLength(5)
        }
      });
    }

    // create once the validation error strings
    this.validationErrors = {
      user: {
        email: {
          checks: ['required', 'email'],
          errors: {
            required() {
              return 'The email is required';
            },
            email() {
              return 'Email must be valid email';
            }
          }
        },

        name: {
          checks: ['required', 'minLength'],
          errors: {
            required() {
              return 'The name is required';
            },
            minLength(params) {
              return `Name must have at least ${params.min} letters`;
            }
          }
        },

        password: {
          checks: ['required', 'minLength'],
          errors: {
            required() {
              return 'The password is required';
            },
            minLength(params) {
              return `Password must have at least ${params.min} letters`;
            }
          }
        }
      }
    };

    return {
      user
    };
  }
};
</script>
