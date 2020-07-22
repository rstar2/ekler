<template>
  <v-dialog v-model="active" max-width="450">
    <v-card>
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-row class="flex-nowrap">
            <v-col cols="12">
              <div class="body-1">{{ text }}</div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <!-- Move the buttons to the right -->
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="active = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  // use the 'text' property for v-model
  model: {
    prop: 'text',
    event: 'close'
  },
  computed: {
    active: {
      get() {
        return !!this.text;
      },
      set(isActive) {
        if (!isActive) {
          this.$emit('close', '');
        }
      }
    }
  }
};
</script>
