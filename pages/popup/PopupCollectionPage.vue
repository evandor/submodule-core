<template>
  <q-page class="darkInDarkMode brightInBrightMode" style="padding-top: 90px">
    <div>hi</div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <SidePanelCollectionsPageToolbar />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import SidePanelCollectionsPageToolbar from 'src/core/pages/sidepanel/helper/SidePanelCollectionsPageToolbar.vue'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import '@he-tree/vue/style/default.css'
import { NodeTreeObject, useTabsetsFunctions } from 'src/core/pages/common/useTabsetsFunctions'

const router = useRouter()

const { ondrop2, removeNonMatches, openIndicatorIcon, handleTreeClick, getTreeData, tabsetsForSpace } =
  useTabsetsFunctions()

const tabsets = ref<Tabset[]>([])
const treeData = ref<NodeTreeObject[]>()
const currentTabset = ref<Tabset | undefined>(undefined)
const filter = ref<string | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('PopupCollectionsPage', document.location.href)
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  if (tabsets.value && tabsets.value.length > 0) {
    treeData.value = getTreeData(tabsets.value)
    if (filter.value && filter.value.trim() !== '') {
      treeData.value = removeNonMatches(treeData.value, filter.value)
    }
  }
})

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = tabsetsForSpace(currentSpace)
  } else {
    //console.log("loading from ", [...useTabsetsStore().tabsets.values()])
    tabsets.value = [...useTabsetsStore().tabsets.values()]
  }
})

const topLevelSubfolderExist = () =>
  treeData.value
    ? treeData.value.findIndex((nto: NodeTreeObject) => nto.children && nto.children.length > 0) >= 0
    : false

const filterTermChanged = (val: { term: string }) => (filter.value = val.term)
</script>

<style lang="scss">
.fitpage {
  height: calc(100vh - 130px);
}
</style>
