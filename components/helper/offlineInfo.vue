<template>
  <div v-if="!useUiStore().networkOnline"
       class="q-ma-md q-pa-md justify text-body1" style="border:1px dotted red">
    Sorry, you seem to be offline... try to reload in some minutes
  </div>

</template>

<script lang="ts" setup>

import {useUiStore} from "src/ui/stores/uiStore";
</script>
