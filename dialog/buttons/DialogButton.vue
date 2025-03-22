<template>
  <q-btn
    :type="props.type"
    class="cursor-pointer"
    :outline="!defaultAction"
    padding="xs lg"
    :disable="props.disable"
    @click="emits('wasClicked')"
    align="around"
    size="sm"
    data-testid="addTabsetSubmitBtn"
    :color="props.color"
    :label="props.label"
    v-close-popup />
</template>

<script lang="ts" setup>
const emits = defineEmits(['wasClicked'])

type Props = {
  label: string
  color?: string
  type?: string
  disable?: boolean
  defaultAction?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  type: 'button',
  disable: false,
  defaultAction: false,
})

// const props = withDefaults(defineProps<Props>(), {
//   title: 'My Tabsets',
//   forceTitle: false,
//   showSearchBox: false,
//   searchTerm: '',
// })
// const props = defineProps({
//   label: { type: String, required: true },
//   color: { type: String, default: 'warning' },
//   type: { type: String, default: 'button' },
//   disable: { type: Boolean, default: false },
// })
</script>
