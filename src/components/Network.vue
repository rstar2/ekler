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
      <d3-network :net-nodes="nodes" :net-links="links" :options="options" :link-cb="linkCallback" />
    </v-col>
  </v-row>
</template>

<script>
import D3Network from 'vue-d3-network';
import 'vue-d3-network/dist/vue-d3-network.css';

export default {
  name: 'Network',

  components: {
    D3Network
  },
  data() {
    return {
      nodes: [
        { id: 1, name: 'my node 1' },
        { id: 2, name: 'my node 2' },
        { id: 3, _color: 'orange' },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
        { id: 9 }
      ],
      links: [
        { sid: 1, tid: 2, _color: 'red' },
        { sid: 2, tid: 8, _color: 'f0f' },
        { sid: 3, tid: 4, _color: 'rebeccapurple' },
        { sid: 4, tid: 5, name: 3 },
        { sid: 5, tid: 6 },
        { sid: 7, tid: 8 },
        { sid: 5, tid: 8 },
        { sid: 3, tid: 8 },
        { sid: 7, tid: 9 }
      ],
      options: {
        force: 3000,
        nodeSize: 20,
        nodeLabels: true,
        linkLabels: true,
        linkWidth: 2
      }
    };
  },
  methods: {
    linkCallback(link) {
      link._svgAttrs = { 'marker-end': 'url(#m-end)' };
      return link;
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
