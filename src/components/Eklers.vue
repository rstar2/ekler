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
        :node-cb="nodeCallback"
        @node-click="nodeClick"
      />
    </v-col>
  </v-row>
</template>

<script>
import D3Network from 'vue-d3-network';
import 'vue-d3-network/dist/vue-d3-network.css';

import * as avatars from '@/services/avatars';

const LINK_WIDTH = 3;
const NODE_SIZE = 48;

/**
 *
 * @param {String} imageUrl
 * @param {Number} size
 */
export function createSVGFromImgUrl(imageUrl, size = NODE_SIZE) {
  const middle = size / 2;
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <!-- Clip the image as a circle -->
    <defs>
      <clipPath id="myCircle">
              <circle cx="${middle}" cy="${middle}" r="${middle}" fill="#FFFFFF" />
      </clipPath>
    </defs>
    <image href="${imageUrl}" height="${size}" width="${size}" clip-path="url(#myCircle)"/>
  </svg>`;
}

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
    checkouts: {
      type: Object,
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
      const nodes = this.users.map(user => {
        const node = { id: user.id, name: user.name, email: user.email };

        // mark the authorized user
        if (this.authUserId && node.id === this.authUserId) {
          node._color = 'orange';
        }

        // mark all checkout users
        if (this.checkouts[node.id]) {
          node._color = 'red';
        }

        return node;
      });

      return nodes;
    },
    links() {
      //  return [{ sid: 4, tid: 5, name: 3 }, ...]
      const links = [];

      this.eklers.forEach(({ /* String */ id: sid, /* Object */ to }) => {
        Object.keys(to).forEach(tid => {
          let _color;
          if (this.authUserId && (this.authUserId === sid || this.authUserId === tid)) _color = 'orange';

          if (to[tid].checkout) _color = 'red';

          links.push({ sid, tid, name: to[tid].owes, _color });
        });
      });

      // just "specify" so that Vue can react on its change also, as intenally in D3Network
      // the links are not changed when nodes are
      // In other words make link update/depend when nodes update
      this.nodes;

      return links;
    }
  },
  created() {
    // create it here and not in data as it's not needed to be "reactive"
    this.options = {
      force: 5000,
      nodeSize: NODE_SIZE,
      nodeLabels: true,
      linkLabels: true,
      linkWidth: LINK_WIDTH
    };
  },
  methods: {
    linkCallback(link) {
      link._svgAttrs = { 'marker-end': 'url(#m-end)' };
      return link;
    },
    nodeCallback(node) {
      node.svgSym = createSVGFromImgUrl(avatars.createAvatar(node.email));
      return node;
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
