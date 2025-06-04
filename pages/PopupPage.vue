<template>
  <q-toolbar class="text-primary lightgrey">
    <div class="row fit">
      <div class="col-xs-12 col-md-5">
        <q-toolbar-title>
          <div class="row justify-start items-baseline">
            <div>
              <span class="text-dark text-subtitle2">Tabsets</span>
            </div>
          </div>
        </q-toolbar-title>
      </div>
      <div class="col-xs-12 col-md-7 text-right"></div>
    </div>
  </q-toolbar>

  <div class="row fit greyBorderTop"></div>

  <div class="row q-ma-sm" style="min-width: 300px; max-width: 400px">
    <!--    <div class="col-12 ellipsis">Tabset: {{ currentTabset?.name }}</div>-->

    <div class="col-3 ellipsis text-right text-body2 q-mr-sm">Tabset</div>
    <div class="col-8 ellipsis">
      <SidePanelTabsetsSelectorWidget />
    </div>
    <div class="col ellipsis text-right"></div>

    <div class="col-3 ellipsis text-right text-body2 q-mr-sm">Tab</div>
    <div class="col-8 ellipsis">{{ currentTab?.url }}</div>
    <div class="col ellipsis text-right">{{ alreadyInTabset }}</div>

    <div class="col-8 q-ma-md">
      <q-btn label="add" @click="add()" dense flat />
      <q-btn v-if="!sidepanelEnabled" label="open sidepanel" @click="setSidepanel(true)" dense flat />
      <q-btn v-else label="close sidepanel" @click="setSidepanel(false)" dense flat />
    </div>
    <div class="col-4 q-ma-md"></div>
  </div>
</template>

<script setup lang="ts">
import { uid } from 'quasar'
import { useTabsStore } from 'src/bookmarks/stores/tabsStore'
import SidePanelTabsetsSelectorWidget from 'src/core/components/widgets/SidePanelTabsetsSelectorWidget.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { ref, watchEffect } from 'vue'

const currentTabset = ref<Tabset | undefined>(undefined)
const currentTab = ref<chrome.tabs.Tab | undefined>(undefined)
const alreadyInTabset = ref<boolean>(false)
const sidepanelEnabled = ref(false)
const containedInTsCount = ref(0)

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  currentTab.value = useTabsStore().currentChromeTab
  if (currentTab.value) {
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(currentTab.value.url)
    containedInTsCount.value = useTabsetService().tabsetsFor(currentTab.value.url!).length
  }
})

watchEffect(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel
      .getOptions({})
      .then((options: any) => {
        console.log('got options', options)
        //sidepanelEnabled.value = options ? options.enabled : false
      })
      .catch((err) => console.log('err', err))
  }
})

const add = () => {
  if (currentTab.value && currentTabset.value) {
    const tab = new Tab(uid(), currentTab.value)
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(tab, currentTabset.value))
  }
}

const setSidepanel = async (open: boolean) => {
  if (chrome.sidePanel) {
    console.log('setting sidepanel to ', open)
    const ts: chrome.tabs.Tab[] = await chrome.tabs.query({ active: true, currentWindow: true })
    // @ts-expect-error TODO
    await chrome.sidePanel.open({ windowId: ts[0].windowId })
    await chrome.sidePanel.setOptions({
      path: 'www/index.html',
      enabled: open,
    })
  }
}
</script>
