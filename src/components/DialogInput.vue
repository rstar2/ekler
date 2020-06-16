<template>
  <v-dialog v-model="active" max-width="450">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-row class="flex-nowrap">
            <v-col cols="12">
              <v-text-field
                :type="type"
                ref="input"
                v-model="value"
                :rules="[v => !!v || 'Required']"
                @keydown.enter="disabled ? void 0 : doAction()"
                data-testid="in-value"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <!-- Move the buttons to the right -->
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="active = false">Cancel</v-btn>
        <v-btn color="green darken-1" text @click="doAction" :disabled="disabled" data-testid="btn-action">Set</v-btn>
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
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'text'
    }
  },
  // use the 'show' property for a v-model
  model: {
    prop: 'show',
    event: 'close'
  },
  data() {
    return {
      value: ''
    };
  },
  computed: {
    active: {
      get() {
        return this.show;
      },
      set(isActive) {
        if (!isActive) {
          // reset the inout field - both value and validation
          this.$refs['input'].reset();
        }
        this.$emit('close', isActive);
      }
    },
    disabled() {
      return !this.value;
    }
  },
  methods: {
    doAction() {
      if (this.disabled) return;

      this.$emit('action', this.value);

      // close the dialog
      this.active = false;
    }
  }
};
</script>
