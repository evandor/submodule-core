<template>
  <q-page padding>
    <div class="row justify-center items-center" style="height: 500px">
      <div class="text-h5 content-center">Tabsets Fullpage View</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { LocalStorage, useQuasar } from 'quasar'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const { inBexMode } = useUtils()

const $q = useQuasar()
const router = useRouter()

onMounted(() => {
  Analytics.firePageViewEvent('FullPageStart', document.location.href)
})

$q.loading.show({
  message: 'Initializing tabsets. Please hang on...',
})
if (inBexMode()) {
  setTimeout(() => {
    chrome.tabs.getCurrent((t?: chrome.tabs.Tab) => {
      //console.log("got tab", t)
      const options = {
        tabId: t?.id || 0,
        enabled: false,
      }
      console.log('setting options', options)
      chrome.sidePanel.setOptions(options)
    })
    if (useTabsetsStore().tabsets.size === 0) {
      router.push('/')
    } else {
      const selectedTS = LocalStorage.getItem('selectedTabset') as string | undefined
      if (selectedTS) {
        console.log('setting selected tabset from storage', selectedTS)
        useTabsetsStore().selectCurrentTabset(selectedTS)
        router.push('/fullpage/tabsets/' + selectedTS)
      } else {
        router.push('/fullpage/tabsets')
      }
    }
    setTimeout(() => {
      $q.loading.hide()
    }, 500)
    //timer = void 0
  }, 2000)
} else {
  router.push('/sidepanel/tabsets')
}
</script>
