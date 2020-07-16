<template>
  <v-row class="text-center">
    <v-col cols="12">
      <svg class="defs-markers">
        <defs>
          <marker
            id="m-end"
            markerWidth="10"
            markerHeight="10"
            refX="12"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z"></path>
          </marker>
        </defs>
      </svg>
      <d3-network
        :net-nodes="nodes"
        :net-links="links"
        :options="options"
        :link-cb="linkCallback"
        @node-click="nodeClick"
      />
    </v-col>
  </v-row>
</template>

<script>
import D3Network from 'vue-d3-network';
import 'vue-d3-network/dist/vue-d3-network.css';

export default {
  name: 'Eklers',

  components: {
    D3Network
  },
  props: {
    eklers: {
      type: Array,
      required: true
    },
    users: {
      type: Array,
      required: true
    },
    authUserId: {
      type: String,
      default: null
    }
  },
  computed: {
    nodes() {
      // return [ { id: 1, name: 'my node 1' }, ....]
      const nodes = this.users.map(user => ({ id: user.id, name: user.name }));
      if (this.authUserId) {
        nodes.find(node => {
          if (node.id === this.authUserId) {
            node._color = 'orange';
            return true;
          }
        });
      }

      return nodes;
    },
    links() {
      //  return [{ sid: 4, tid: 5, name: 3 }, ...]
      const links = [];

      this.eklers.forEach(({ /* String */ id: sid, /* Object */ owes }) => {
        Object.keys(owes).forEach(tid => {
          let _color;
          if (this.authUserId && (this.authUserId === sid || this.authUserId === tid)) _color = 'orange';
          links.push({ sid, tid, name: owes[tid], _color });
        });
      });

      // just "specify" so that Vue can reach on it change also, as intenally in D3Network
      // the links are not changed when nodes are
      this.nodes;

      return links;
    }
  },
  created() {
    // create it here and not in data as it's not needed to be "reactive"
    this.options = {
      force: 3000,
      nodeSize: 20,
      nodeLabels: true,
      linkLabels: true,
      linkWidth: 2
    };
  },
  methods: {
    linkCallback(link) {
      link._svgAttrs = { 'marker-end': 'url(#m-end)' };
      return link;
    },
    nodeClick(event, node) {
      const user = this.users.find(user => user.id === node.id);
      this.$emit('userClick', user);
    }
  }
};
</script>

<style scoped>
.defs-markers {
  width: 0;
  height: 0;
  position: absolute;
}
#m-end path,
#m-start {
  fill: rgba(18, 120, 98, 0.8);
}
</style>
