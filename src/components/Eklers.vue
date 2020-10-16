<template>
  <v-row class="text-center flex-column eklers">
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

import * as avatars from '@/services/avatars';

const LINK_WIDTH = 3;
const NODE_SIZE = 48;

/**
 *
 * @param {{_color: String}} node
 * @param {String} imageUrl
 * @param {Number} size
 */
export function createSVGFromImgUrl(node, imageUrl, size = NODE_SIZE, border = 1) {
  const middle = size / 2;
  const borderCircle = middle - border / 2;
  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <!-- Clip the image as a circle -->
    <defs>
      <clipPath id="myCircle">
              <circle cx="${middle}" cy="${middle}" r="${middle}" fill="#FFFFFF" />
      </clipPath>
    </defs>
    <image class="node" href="${imageUrl}" height="${size}" width="${size}" clip-path="url(#myCircle)"/>
    <circle cx="${middle}" cy="${middle}" r="${borderCircle}" stroke="${node._color}" stroke-width="${border}" fill="none" />
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
    users: {
      type: Array,
      required: true
    },
    authUserId: {
      type: String,
      default: null
    },
    isBlocked: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      options: {
        force: 5000,
        nodeSize: NODE_SIZE,
        nodeLabels: true,
        linkLabels: true,
        linkWidth: LINK_WIDTH,
        size: { h: 600 }
      },
      nodes: []
    };
  },
  computed: {
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
  watch: {
    users: {
      handler() {
        this.updateNodes();
      },
      immediate: true
    },
    authUserId() {
      // on change update the nodes
      this.updateNodes();
    }
  },
  //   created() {
  //     window.addEventListener('resize', this.onResize);
  //   },
  //   destroyed() {
  //     window.removeEventListener('resize', this.onResize);
  //   },
  mounted() {
    console.log('Create Height', this.$el.clientHeight);
    // TODO: FIX this resizing
    this.options.size.h = this.$el.clientHeight - 32;
  },
  methods: {
    updateNodes() {
      // return [ { id: 1, name: 'my node 1' }, ....]
      this.nodes = this.users.map(user => {
        const node = { id: user.id, name: user.name };

        // mark the authorized user
        if (this.authUserId && node.id === this.authUserId) {
          node._color = 'orange';
        }

        // mark all checkout users
        if (this.isBlocked(node.id)) {
          node._color = 'red';
        }

        // // make the node be the avatar as a circle
        // node.svgSym = createSVGFromImgUrl(node, imageUrl);

        return node;
      });

      // request/get the avatars for each user
      const avatarPromises = this.users.map(user => avatars.getAvatar(user));

      Promise.all(avatarPromises).then(imageUrls => {
        // attach the avatar image url to each node
        // NOTE the whole this.nodes has to be 'updated' in order Vue reactivity to catch the change
        // updating just a single array items will not
        const nodes = [];
        let node;
        for (let i = 0; i < imageUrls.length; i++) {
          node = this.nodes[i];
          // console.log('Attach avatar URL ', imageUrls[i], 'to', node.name);
          nodes[i] = {
            ...node,
            svgSym: createSVGFromImgUrl(node, imageUrls[i])
          };
        }

        this.nodes = nodes;
      });
    },
    linkCallback(link) {
      link._svgAttrs = { 'marker-end': 'url(#m-end)' };
      return link;
    },
    nodeClick(event, node) {
      const user = this.users.find(user => user.id === node.id);
      this.$emit('userClick', user);
    }
    // onResize() {
    //   console.log('Height', this.$el.clientHeight);
    //   //   this.options.size.h = this.$el.clientHeight;
    // }
  }
};
</script>

<style scoped>
.eklers {
  width: 100%;
}

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
