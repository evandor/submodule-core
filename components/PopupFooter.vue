<template>
  <q-footer class="q-pa-none q-mt-sm darkInDarkMode brightInBrightMode" style="border-top: 1px solid lightgrey">
    <template v-if="checkToasts()">
      <Transition name="fade" appear>
        <q-banner
          inline-actions
          dense
          rounded
          style="font-size: smaller; text-align: center"
          :class="toastBannerClass()">
          {{ useUiStore().toasts[0]?.msg }}
          <template v-slot:action v-if="useUiStore().toasts[0]?.actions[0]">
            <q-btn
              flat
              :label="useUiStore().toasts[0]!.actions[0].label"
              @click="useUiStore().callUndoActionFromCurrentToast()" />
          </template>
        </q-banner>
      </Transition>
    </template>

    <div v-else class="row fit q-ma-none q-pa-none">
      <div class="col-6"></div>
      <div class="col text-right">
        <q-btn
          v-if="!sidepanelEnabled"
          icon="open_in_new"
          flat
          size="md"
          style="max-width: 32px"
          @click="openBrowserSidepanel()"
          class="cursor-pointer" />
      </div>
    </div>
  </q-footer>
</template>

<script setup lang="ts">
import { ToastType } from 'src/core/models/Toast'
import { useUtils } from 'src/core/services/Utils'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref } from 'vue'

const { openSidepanel } = useUtils()

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

const checkToasts = () => {
  if (useUiStore().toasts.length > 0) {
    const useDelay = 3000
    useUiStore().delayedToastRemoval(useDelay)
    // const oldShowButton = showSuggestionButton.value
    // const oldDoShowButton = doShowSuggestionButton.value
    // transitionGraceTime.value = true
    // showSuggestionButton.value = false
    // doShowSuggestionButton.value = false
    // setTimeout(() => {
    //   if (useUiStore().toasts.length === 0) {
    //     // only if all toasts are gone
    //     transitionGraceTime.value = false
    //     showSuggestionButton.value = oldShowButton
    //     doShowSuggestionButton.value = oldDoShowButton
    //   }
    // }, useDelay + 1100) // must be higher than css value in fade-leave-active

    return true
  }
  return false
}

const toastBannerClass = () => {
  const defaults = ' text-white q-py-none'
  switch (useUiStore().toasts[0]?.type) {
    case ToastType.INFO:
      return 'bg-positive' + defaults
    case ToastType.WARNING:
      return 'bg-warning' + defaults
    case ToastType.ERROR:
      return 'bg-negative' + defaults
    default:
      return 'bg-negative' + defaults
  }
}

const openBrowserSidepanel = async () => {
  openSidepanel().then(() => {
    sidepanelEnabled.value = !sidepanelEnabled.value
    window.close()
  })
}
</script>
