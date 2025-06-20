<template>
  <!-- PopupCollectionSelector -->
  <div class="row">
    <div class="col-9 q-ma-none q-pa-none text-center" style="border: 0 solid red">
      <div class="text-bold ellipsis">
        <template v-if="currentTabset && mode == 'default'">
          <q-select
            :style="tabsetColorStyle()"
            filled
            :disable="props.disable"
            transition-show="scale"
            transition-hide="scale"
            :label="tabsetSelectLabel()"
            v-model="tabsetSelectionModel"
            @update:model-value="(newTabset: object) => switchTabset(newTabset)"
            :options="tabsetSelectionOptions"
            dense
            options-dense>
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <template v-if="scope.opt.label.length > 0">
                  <q-item-section style="max-width: 20px" v-if="scope.opt.label !== 'Switch to'">
                    <q-icon
                      size="xs"
                      :color="scope.opt.icon_color ? scope.opt.icon_color : 'primary'"
                      :name="scope.opt.icon"
                      v-if="scope.opt.icon" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </template>
                <q-item-section class="q-ma-none q-pa-none" v-else>
                  <q-separator />
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </template>
        <template v-else-if="mode == 'add-tabset'">
          <transition appear enter-active-class="animated fadeInDown" leave-active-class="animated fadeInUp">
            <q-input @blur="blurNewTabset()" autofocus v-model="newTabsetName" dense label="Add new Collection" />
          </transition>
        </template>
        <template v-else>
          <q-spinner color="primary" size="1em" />
        </template>
      </div>
    </div>

    <div
      class="col text-subtitle1 text-right q-ma-none q-pa-none"
      v-if="!useUiStore().appLoading"
      style="border: 0 solid green">
      <slot name="iconsRight">
        <q-btn
          v-if="mode === 'default'"
          outline
          icon="o_add"
          :disable="props.tab !== undefined && props.tab.url === props.url"
          color="primary"
          unelevated
          size="sm"
          @click="addTab()"
          class="cursor-pointer">
        </q-btn>
        <q-btn
          v-if="mode === 'add-tabset'"
          :disable="newTabsetName?.trim().length == 0"
          icon="o_keyboard_return"
          color="primary"
          unelevated
          size="15px"
          @click="addTabset()"
          @keydown.enter.prevent="addTabset()"
          class="cursor-pointer q-px-md">
        </q-btn>
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { uid, useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useUtils } from 'src/core/services/Utils'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import DeleteTabsetDialog from 'src/tabsets/dialogues/DeleteTabsetDialog.vue'
import EditTabsetDialog from 'src/tabsets/dialogues/EditTabsetDialog.vue'
import NewTabsetDialog from 'src/tabsets/dialogues/NewTabsetDialog.vue'
import { SaveOrReplaceResult } from 'src/tabsets/models/SaveOrReplaceResult'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

type SelectOption = {
  label: string
  value: string
  disable?: boolean
  icon?: string
  icon_color?: string
}

const { t } = useI18n({ useScope: 'global' })
const { openSidepanel } = useUtils()

const emits = defineEmits(['tabset-changed', 'add-tabset'])

const $q = useQuasar()
const router = useRouter()

type Props = { tab: Tab | undefined; url: string | undefined; disable?: boolean }

const props = withDefaults(defineProps<Props>(), {
  disable: false,
})

const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentBrowserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const overlap = ref(0.5)
const overlapTooltip = ref('')
const showWatermark = ref(false)
const watermark = ref('')
const tabsets = ref<Tabset[]>([])
const animateMenuButton = ref(false)
const sidepanelEnabled = ref(false)

const tabsetSelectionModel = ref<SelectOption | undefined>(undefined)
const tabsetSelectionOptions = ref<SelectOption[]>([])
const stashedTabs = ref(false)

const mode = ref<'default' | 'add-tabset'>('default')
const newTabsetName = ref<string | undefined>(undefined)
const addTabsetRef = ref<HTMLElement>(null as unknown as HTMLElement)

windowLocation.value = window.location.href

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]
  const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
  const space = useSpacesStore().space

  stashedTabs.value = tabsets.value.filter((ts: Tabset) => ts.type === TabsetType.SESSION).length > 0

  tabsetSelectionOptions.value = tabsets.value
    .filter((ts: Tabset) =>
      useFeaturesStore().hasFeature(FeatureIdent.ARCHIVE_TABSET) ? ts.status !== TabsetStatus.ARCHIVED : true,
    )
    .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL)
    .filter((ts: Tabset) => ts.type !== TabsetType.SESSION)
    //.filter((ts: Tabset) => ts.id !== currentTabset.value?.id)
    .filter((ts: Tabset) => {
      if (useSpaces && space) {
        return ts.spaces.indexOf(space.id) >= 0
      } else if (useSpaces && !space) {
        return ts.spaces?.length === 0
      }
      return true
    })
    .map((ts: Tabset) => {
      return {
        label: ts.name,
        value: ts.id,
        disable: ts.id === currentTabset.value?.id,
      }
    })
    .sort((a: SelectOption, b: SelectOption) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))

  if (tabsetSelectionOptions.value.length == 1) {
    tabsetSelectionOptions.value = []
  }
  if (tabsetSelectionOptions.value.length > 1) {
    tabsetSelectionOptions.value.unshift({ label: 'Switch to', value: '', disable: true, icon: 'switch_horiz' })
  }

  if (tabsetSelectionOptions.value.length > 10) {
    tabsetSelectionOptions.value = tabsetSelectionOptions.value.slice(0, 10)
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'show all...', value: '' })
  } else if (tabsetSelectionOptions.value.length > 4) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'more...', value: '' })
  }

  if (tabsets.value.length > 1) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
  }

  tabsetSelectionOptions.value.push({ label: 'Show Collection', value: 'show-tabset', icon: 'o_eye' })
  //tabsetSelectionOptions.value.push({ label: 'Add Collection', value: 'add-tabset', icon: 'o_add' })
  tabsetSelectionOptions.value.push({ label: 'Manage Tabsets', value: 'popup-manage-tabsets', icon: 'o_edit' })

  if (stashedTabs.value) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'Stashed Tabs', value: 'stashed-tabs', icon: 'o_add' })
  }

  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'Select Space...', value: 'select-space', icon: 'o_space_dashboard' })
  }
})

watchEffect(() => {
  animateMenuButton.value = useUiStore().animateMenuButton
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  //console.log('---got current tabset', currentTabset.value)
  if (currentTabset.value) {
    tabsetSelectionModel.value = {
      label: currentTabset.value?.name || '?',
      value: currentTabset.value?.id || '-',
    }
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  } else {
    // redirectOnEmpty()
  }
})

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentBrowserTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) && useUiStore().toolbarFilter
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')

const switchTabset = async (tabset: object) => {
  const tsId = tabset['value' as keyof object]
  if (tsId === 'select-space') {
    await router.push('/sidepanel/spaces')
    return
  }
  if (tsId === 'create-tabset') {
    $q.dialog({
      component: NewTabsetDialog,
      componentProps: {
        tabsetId: useTabsetsStore().getCurrentTabset?.id,
        spaceId: useSpacesStore().space?.id,
        fromPanel: true,
      },
    })
    tabsetSelectionModel.value = {
      label: currentTabset.value?.name || '?',
      value: currentTabset.value?.id || '-',
    }
    return
  }
  if (tsId === 'edit-tabset' && currentTabset.value) {
    $q.dialog({
      component: EditTabsetDialog,
      componentProps: {
        tabsetId: currentTabset.value.id,
        tabsetName: currentTabset.value.name,
        tabsetColor: currentTabset.value.color,
        window: currentTabset.value.window,
        details: currentTabset.value.details || useUiStore().listDetailLevel,
        fromPanel: true,
      },
    })
    return
  }
  if (tsId === 'popup-manage-tabsets') {
    router.push('/popup/tabsets')
    return
  }
  if (tsId === 'show-tabset') {
    router.push('/popup/tabset')
    return
  }
  if (tsId === 'add-tabset') {
    mode.value = 'add-tabset'
    return
  }
  if (tsId === 'delete-tabset' && currentTabset.value) {
    $q.dialog({
      component: DeleteTabsetDialog,
      componentProps: {
        tabsetId: currentTabset.value.id,
        tabsetName: currentTabset.value.name,
        tabsCount: currentTabset.value.tabs.length,
      },
    })
    return
  }
  if (tsId === 'stashed-tabs') {
    router.push('/sidepanel/sessions')
    return
  }
  if (tsId === '') {
    await router.push('/sidepanel/collections')
    return
  }
  const result: ExecutionResult<Tabset | undefined> = await useCommandExecutor().execute(
    new SelectTabsetCommand(tabset['value' as keyof object]),
  )
  currentTabset.value = result.result
  emits('tabset-changed')
}

const tabsetSelectLabel = () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space?.label || 'no space selected'
  }
  return 'Collection'
}

const tabsetColorStyle = () => {
  return currentTabset.value && currentTabset.value.color
    ? 'border-left: 3px solid ' +
        currentTabset.value.color +
        ';border-right: 3px solid ' +
        currentTabset.value.color +
        ';border-radius:3px'
    : ''
}

chrome.runtime.getContexts({}, (ctxs: object[]) => {
  //console.log('ctxs', ctxs)
  sidepanelEnabled.value = ctxs.filter((c: object) => 'SIDE_PANEL' === c['contextType' as keyof object]).length > 0
  // console.log('sidepanelEnabled', sidepanelEnabled.value)
})

const openBrowserSidepanel = async () => {
  openSidepanel().then(() => {
    sidepanelEnabled.value = !sidepanelEnabled.value
  })
  // if (chrome.sidePanel) {
  //   console.log('setting sidepanel to open')
  //   const ts: chrome.tabs.Tab[] = await chrome.tabs.query({ active: true, currentWindow: true })
  //   // @ts-expect-error TODO
  //   await chrome.sidePanel.open({ windowId: ts[0].windowId })
  //   await chrome.sidePanel
  //     .setOptions({
  //       path: 'www/index.html',
  //       enabled: true,
  //     })
  //     .then(() => {
  //       sidepanelEnabled.value = !sidepanelEnabled.value
  //     })
  // }
}
const addTab = () => {
  console.log('hier', currentBrowserTab.value)
  if (currentBrowserTab.value) {
    const newTab: Tab = new Tab(uid(), currentBrowserTab.value)
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(newTab, currentTabset.value)) //, props.folder?.id))
    // .then((res: ExecutionResult<any>) => {
    //   console.log('res', typeof res)
    //   if (res instanceof ExecutionFailureResult) {
    //   } else {
    //     setTimeout(() => {
    //       window.close()
    //     }, 2000)
    //   }
    // })
    //window.close()
  }
  //handleError('current browser tab not set!')
}

const blurNewTabset = () => {
  setTimeout(() => {
    if (!newTabsetName.value || newTabsetName.value.length == 0) {
      mode.value = 'default'
      tabsetSelectionModel.value = {
        label: currentTabset.value?.name || '?',
        value: currentTabset.value?.id || '-',
      }
    }
  }, 500)
}

const addTabset = () => {
  console.log('adding tabset', newTabsetName.value)
  if (newTabsetName.value && newTabsetName.value.trim().length > 0) {
    useCommandExecutor()
      .executeFromUi(new CreateTabsetCommand(newTabsetName.value))
      .then((res: ExecutionResult<SaveOrReplaceResult>) => {
        newTabsetName.value = undefined
        mode.value = 'default'
        useTabsetsStore().selectCurrentTabset(res.result.tabset.id)
      })
  }
}
</script>
