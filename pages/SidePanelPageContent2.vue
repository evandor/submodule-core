<template>
  <!-- optional: notes -->
  <div class="col-12">
    <SidePanelNotesView v-if="props.tabset" :tabset="props.tabset" />
  </div>

  <!-- folders -->
  <div class="col-12">
    <SidePanelFoldersView2
      v-if="props.tabset"
      :key="props.tabset.id + '_' + props.tabset.folderActive + '_' + tabsetsLastUpdate"
      :tabset="props.tabset"
      :filter="filter || ''"
      @folder-selected="expand()"
      @folders-found="(n: number) => emits('folders-found', n)" />
  </div>

  <SidePanelPageTabList
    :key="tabsetsLastUpdate + '_' + filter"
    :filter="filter || ''"
    :active-folder="props.tabset.id"
    :tabsCount="props.tabset.tabs.length"
    :tabset="tabsetForTabList(props.tabset as Tabset)"
    @tabs-found="(n: number) => emits('tabs-found', n)" />
</template>

<script setup lang="ts">
import SidePanelNotesView from 'src/notes/views/sidepanel/SidePanelNotesView.vue'
import SidePanelPageTabList from 'src/tabsets/layouts/SidePanelPageTabList.vue'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import SidePanelFoldersView2 from 'src/tabsets/views/sidepanel/SidePanelFoldersView2.vue'
import { ref, watchEffect } from 'vue'

type Props = {
  tabset: Tabset
  filter?: string
}

const props = defineProps<Props>()
const emits = defineEmits(['tabs-found', 'folders-found'])

const tabsetsLastUpdate = ref(0)

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

const tabsetForTabList = (tabset: Tabset) => {
  if (tabset.folderActive) {
    const af = useTabsetService().findFolder(tabset.folders, tabset.folderActive)
    if (af) {
      return af
    }
  }
  return tabset
}

const expand = () => {
  console.log('expanding')
}
</script>
