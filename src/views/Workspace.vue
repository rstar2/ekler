<template>
  <div class="network">
    <Network />
  </div>
</template>

<script>
// @ is an alias to /src
import Network from '@/components/Network.vue';

export default {
  name: 'Workspace',
  components: {
    Network
  }
};
</script>
