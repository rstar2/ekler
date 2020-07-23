<template>
  <v-list disabled>
    <v-subheader>HISTORY</v-subheader>
    <v-list-item-group color="primary">
      <v-list-item v-for="(record, i) in history" :key="i">
        <!-- <v-list-item-icon>
          <v-icon v-text="record.from"></v-icon>
        </v-list-item-icon> -->
        <v-list-item-content>
          <v-list-item-title v-text="getRecordTitle(record)" :class="getRecordClass(record)" />
          <v-list-item-subtitle v-text="getRecordSubtitle(record)" />
          <v-divider />
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import { pluralize } from '../lib/util.js';

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
     * @param {String} type
     * @param {String} from
     * @param {String} to
     */
    getRecordTitle({ type, from, to, count }) {
      from = this.getUserName(from) || from;
      to = this.getUserName(to) || to;

      switch (type) {
        case 'ADD':
          return `${from} owes ${to} ${count} ${pluralize(count, 'ekler')}`;
        case 'CHECKOUT':
          return `${from} wants his/hers eklers from ${to}`;
      }
    },
    /**
     * @param {String} from
     * @param {String} to
     */
    getRecordSubtitle({ createdAt }) {
      return new Date(createdAt).toLocaleString();
    },
    /**
     * @param {String} type
     */
    getRecordClass({ type }) {
      return {
        'primary--text': type === 'CHECKOUT'
      };
    }
  }
};
</script>
