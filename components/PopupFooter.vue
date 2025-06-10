<template>
  <q-footer class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode" style="border-top: 1px solid lightgrey">
    <div class="row fit q-ma-none q-pa-none">
      <div class="col-6">
        <q-btn v-if="!sidepanelEnabled" label="open sidepanel" @click="setSidepanel(true)" dense flat />
        <!--        <q-btn v-else label="close sidepanel" @click="setSidepanel(false)" dense flat />-->
      </div>
      <div class="col text-right" v-if="useUiStore().appLoading">&nbsp;</div>
      <div v-else class="col text-right">*</div>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref } from 'vue'

const sidepanelEnabled = ref(false)

if (chrome.sidePanel) {
  // chrome.tabs.query({ active: true, lastFocusedWindow: true }).then((ts: chrome.tabs.Tab[]) => {
  //   console.log('got', ts)
  //   if (ts.length > 0 && ts[0]!.id) {

  chrome.runtime.getContexts({}, (ctxs: object[]) => {
    //console.log('ctxs', ctxs)
    sidepanelEnabled.value = ctxs.filter((c: object) => 'SIDE_PANEL' === c['contextType' as keyof object]).length > 0
    // console.log('sidepanelEnabled', sidepanelEnabled.value)
  })

  // chrome.sidePanel
  //   // .getOptions({ tabId: ts[0]!.id })
  //   .getOptions({})
  //   .then((options: any) => {
  //     console.log('got options', options.enabled, options)
  //     sidepanelEnabled.value = options ? options.enabled : false
  //   })
  //   .catch((err) => console.log('err', err))
  // // }
  // // })
}

const setSidepanel = async (open: boolean) => {
  if (chrome.sidePanel) {
    console.log('setting sidepanel to ', open)
    const ts: chrome.tabs.Tab[] = await chrome.tabs.query({ active: true, currentWindow: true })
    // @ts-expect-error TODO
    await chrome.sidePanel.open({ windowId: ts[0].windowId })
    await chrome.sidePanel
      .setOptions({
        path: 'www/index.html',
        enabled: open,
      })
      .then(() => {
        sidepanelEnabled.value = !sidepanelEnabled.value
      })
  }
}
</script>
