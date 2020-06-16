<template>
  <v-dialog v-model="active" max-width="450" :users="users" :activator="activator">
    <v-card>
      <v-card-title class="headline">Give Eklers</v-card-title>

      <v-card-text>
        <v-container grid-list-md>
          <v-row class="flex-column">
            <v-col>
              <!-- if item-value="id" then the user.id will be the returned/selected value -->
              <!-- if the whole user as object is requiered then use :return-object="true" -->
              <v-autocomplete
                v-model="to"
                :items="users"
                :rules="[v => !!v || 'Required']"
                :filter="userFilter"
                item-text="name"
                item-value="id"
                label="To"
                @keydown.enter="disabled ? void 0 : doAction()"
                data-testid="in-to"
              />
            </v-col>
            <v-col>
              <v-text-field
                v-model="count"
                type="number"
                label="Count"
                :rules="[v => !!v || 'Required']"
                @keydown.enter="disabled ? void 0 : doAction()"
                data-testid="in-count"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <!-- Move the buttons to the right -->
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="active = false">Cancel</v-btn>
        <v-btn color="green darken-1" text @click="doAction" :disabled="disabled" data-testid="btn-action">Give</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    users: {
      type: Array,
      required: true
    },
    activator: {
      type: Object,
      required: false
    }
  },
  data() {
    return {
      active: false,
      to: undefined,
      count: undefined
    };
  },
  computed: {
    disabled() {
      return !this.to || !this.count;
    }
  },
  methods: {
    /**
     * Used by the vuetify autocomplete component.
     * @param {{id: String, name:String, ...}} user
     * @param {String} queryText
     * @return {Boolean}
     */
    userFilter(user, queryText /* userText */) {
      const textOne = user.name.toLowerCase();
      const textTwo = user.id.toLowerCase();
      const searchText = queryText.toLowerCase();

      return textOne.indexOf(searchText) > -1 || textTwo.indexOf(searchText) > -1;
    },
    doAction() {
      if (this.disabled) return;

      this.$emit('action', { to: this.to, count: +this.count });

      // close the dialog
      this.active = false;
    }
  }
};
</script>
