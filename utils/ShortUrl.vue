<template>
  <span class="darkColors lightColors blueish">{{ props.label ? props.label : shortenUrl() }}
    <q-tooltip v-if="props.hostnameOnly" class="tooltip">{{ url }}</q-tooltip>
  </span>
</template>

<script lang="ts" setup>

const props = defineProps({
  url: {type: String, required: true},
  label: {type: String, required: false},
  hostnameOnly: {type: Boolean, default: false}
})

const shortenUrl = () => {
  if (props.hostnameOnly) {
    try {
      const theURL = new URL(props.url)
      return theURL.hostname
    } catch (e) {
      return "-"
    }
  }
  return props.url
}
</script>


<style scoped lang="scss">

.body--dark .darkColors .blueish {
  color: $blue-8;
}

.body--light .lightColors .bluish {
  color: $blue-2;
}

</style>
