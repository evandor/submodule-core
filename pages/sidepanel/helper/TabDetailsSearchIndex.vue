<template>
  <div class="col-12 text-caption">
    <div v-for="(k, index) in searchIndex">
      <div class="row" v-if="searchIndex.get(index)['v']">
        <div class="col-4 q-ml-sm text-bold">
          {{ searchIndex.get(index)['name'] }}
        </div>
        <div class="col-7 ellipsis">
          {{ searchIndex.get(index)['v'] }}
          <q-tooltip class="tooltip">{{ searchIndex.get(index)['v'] }}</q-tooltip>
        </div>
        <div class="col text-right">
          <q-icon name="o_check_circle" color="primary" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { useSearchStore } from 'src/search/stores/searchStore'
import { Tab } from 'src/tabsets/models/Tab'
import { PropType, ref, watchEffect } from 'vue'

const props = defineProps({
  tab: { type: Object as PropType<Tab>, required: true },
})

const emits = defineEmits(['count'])

const searchIndex = ref<any>()

watchEffect(() => {
  let typesCount = 0
  const fuseIndex = useSearchStore().getIndex()
  if (fuseIndex) {
    const keyMaps = fuseIndex['_keysMap' as keyof object]
    const res = _.filter(fuseIndex['records' as keyof object], (r: any) => {
      // console.log("tab", props.tab)
      // console.log("comparing", props.tab?.url, r.$[3]?.v, r)
      return props.tab?.url === r.$[3]?.v
    })
    const keys: Map<number, object> = new Map()
    Object.keys(keyMaps).forEach((k: any) => {
      keys.set(keyMaps[k], {
        name: k,
      })
    })

    if (res && res.length > 0) {
      Object.keys(res[0]['$' as keyof object]).forEach((k) => {
        const tmp = res[0]['$' as keyof object][k as keyof object]
        typesCount++
        const v: any = keys.get(+k)
        v.n = tmp['n' as keyof object]
        const c = tmp['v' as keyof object]
        v.v = c //? (c.length > 100 ? c.substring(0,98) + "..." : c) : ''
        keys.set(+k, v)
      })
      searchIndex.value = keys
    }
  }
  emits('count', typesCount)
})
</script>
