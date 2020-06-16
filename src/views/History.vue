<template>
  <v-list disabled>
    <v-subheader>HISTORY</v-subheader>
    <v-list-item-group color="primary">
      <v-list-item v-for="(record, i) in history" :key="i">
        <!-- <v-list-item-icon>
          <v-icon v-text="record.from"></v-icon>
        </v-list-item-icon> -->
        <v-list-item-content>
          <v-list-item-title v-text="getRecordTitle(record)" />
          <v-list-item-subtitle v-text="getRecordSubtitle(record)" />
          <v-divider />
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

export default {
  name: 'History',
  computed: {
    ...mapState(['history']),
    ...mapGetters(['getUserName'])
  },
  mounted() {
    this.$store.dispatch('historyLoad');
  },
  methods: {
    /**
     * @param {String} from
     * @param {String} to
     */
    getRecordTitle({ from, to, count }) {
      from = this.getUserName(from) || from;
      to = this.getUserName(to) || to;
      return `${from} owes ${to} ${count} ekler${count > 1 ? 's' : ''}`;
    },
    /**
     * @param {String} from
     * @param {String} to
     */
    getRecordSubtitle({ createdAt }) {
      return new Date(createdAt).toLocaleString();
    }
  }
};
</script>
