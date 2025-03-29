<template>
  <q-item clickable :dense="dense" :disable="props.disable" @click.stop="emits('wasClicked')">
    <q-item-section style="padding-right: 0; min-width: 25px; max-width: 25px">
      <q-icon size="xs" :name="props.icon" :color="color" />
    </q-item-section>
    <q-item-section>
      <span>
        {{ props.label }}
        <slot name="banner" />
      </span>
    </q-item-section>
    <slot></slot>
  </q-item>
</template>

<script lang="ts" setup>
const emits = defineEmits(['wasClicked'])

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, default: 'info' },
  disable: { type: Boolean, default: false },
  dense: { type: Boolean, default: false },
})
</script>
