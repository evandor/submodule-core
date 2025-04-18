<template>
  <!-- FirstToolbarHelper2 -->
  <q-toolbar class="q-pa-none q-pl-none q-pr-none q-pb-none" :style="offsetTop()">
    <q-toolbar-title>
      <div v-if="showWatermark" id="watermark">{{ watermark }}</div>
      <div class="row q-ma-none q-pa-none" v-if="useUiStore().overlapIndicator">
        <q-linear-progress :value="overlap" size="2px" :style="thresholdStyle()">
          <q-tooltip class="tooltip-small">{{ overlapTooltip }}</q-tooltip>
        </q-linear-progress>
      </div>
      <div class="row q-ma-none q-pa-none">
        <div class="col-6 q-ma-none q-pa-none" style="border: 0 solid red">
          <div class="col-12 text-subtitle1">
            <div class="q-ml-xs q-mt-none">
              <div class="text-body1 text-bold ellipsis">
                <template v-if="currentTabset">
                  <q-select
                    v-if="showTabsetSelection()"
                    filled
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
                          <q-item-section style="max-width: 20px">
                            <q-icon size="xs" :name="scope.opt.icon" v-if="scope.opt.icon" />
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
                  <div v-else>
                    <div class="text-caption q-ml-md">{{ title() }}</div>
                    <div class="q-ml-md">{{ currentTabset.name }}</div>
                  </div>
                </template>
                <template v-else>
                  <q-spinner color="primary" size="1em" />
                </template>
              </div>
            </div>
          </div>
          <!--          </template>-->
        </div>

        <div class="col-2 text-center" style="border: 0 solid blue"></div>
        <div
          class="col-4 text-subtitle1 text-right q-ma-none q-pa-none q-pr-none"
          v-if="!useUiStore().appLoading"
          style="border: 0 solid green">
          <slot name="iconsRight">
            <div class="q-mt-none q-ma-none q-qa-none q-mr-xs q-mt-xs">
              <span>
                <SpecialUrlAddToTabsetComponent
                  v-if="currentChromeTab && currentTabset && currentTabset.type !== TabsetType.SPECIAL"
                  @button-clicked="
                    (args: ActionHandlerButtonClickedHolder) => handleButtonClicked(currentTabset!, args)
                  "
                  :currentChromeTab="currentChromeTab"
                  :tabset="currentTabset"
                  :level="'root'" />
                <transition
                  v-else-if="!currentTabset || currentTabset.type !== TabsetType.SPECIAL"
                  appear
                  enter-active-class="animated fadeIn slower delay-5s"
                  leave-active-class="animated fadeOut">
                  <q-btn icon="add" label="tab" size="sm" class="q-mr-md" @click="addUrlDialog()" />
                </transition>
              </span>
              <!--              <q-icon name="more_vert" size="sm" color="secondary" class="cursor-pointer" />-->
              <!--              <SidePanelPageContextMenu v-if="currentTabset" :tabset="currentTabset as Tabset" />-->
            </div>
          </slot>
        </div>
      </div>
    </q-toolbar-title>
  </q-toolbar>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { useActionHandlers } from 'src/tabsets/actionHandling/ActionHandlers'
import { ActionHandlerButtonClickedHolder } from 'src/tabsets/actionHandling/model/ActionHandlerButtonClickedHolder'
import SpecialUrlAddToTabsetComponent from 'src/tabsets/actionHandling/SpecialUrlAddToTabsetComponent.vue'
import { SelectTabsetCommand } from 'src/tabsets/commands/SelectTabsetCommand'
import AddUrlDialog from 'src/tabsets/dialogues/AddUrlDialog.vue'
import { Tabset, TabsetSharing, TabsetStatus, TabsetType } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { useWindowsStore } from 'src/windows/stores/windowsStore'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

type SelectOption = { label: string; value: string; disable?: boolean; icon?: string }

const { t } = useI18n({ useScope: 'global' })

const props = defineProps({
  title: { type: String, default: 'My Tabsets' },
  forceTitle: { type: Boolean, default: false },
  showSearchBox: { type: Boolean, default: false },
  searchTerm: { type: String, default: '' },
  searchHits: { type: Number, required: false },
})

const emits = defineEmits(['tabset-changed'])

const $q = useQuasar()
const router = useRouter()
const route = useRoute()

const searching = ref(false)
const showFilter = ref(false)
const windowLocation = ref('')
const annimateNewTabsetButton = ref(false)
const currentTabset = ref<Tabset | undefined>(undefined)
const currentChromeTab = ref<chrome.tabs.Tab | undefined>(undefined)
const overlap = ref(0.5)
const overlapTooltip = ref('')
const showWatermark = ref(false)
const watermark = ref('')
const tabsets = ref<Tabset[]>([])

const tabsetSelectionModel = ref<SelectOption | undefined>(undefined)
const tabsetSelectionOptions = ref<SelectOption[]>([])

windowLocation.value = window.location.href

const redirectOnEmpty = () => {
  setTimeout(() => {
    // redirect to welcome page if there are not tabsets
    if (useTabsetsStore().tabsets.size === 0) {
      router.push('/sidepanel/welcome')
    }
  }, 1000)
}

redirectOnEmpty()

watchEffect(() => {
  tabsets.value = [...useTabsetsStore().tabsets.values()] as Tabset[]
  const useSpaces = useFeaturesStore().hasFeature(FeatureIdent.SPACES)
  const space = useSpacesStore().space
  tabsetSelectionOptions.value = tabsets.value
    .filter((ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED)
    .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL)
    .filter((ts: Tabset) => ts.id !== currentTabset.value?.id)
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

  let tabsetsAdded = tabsetSelectionOptions.value.length > 0
  if (tabsetSelectionOptions.value.length > 10) {
    tabsetSelectionOptions.value = tabsetSelectionOptions.value.slice(0, 10)
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'show all...', value: '' })
  } else if (tabsetSelectionOptions.value.length > 1) {
    tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    tabsetSelectionOptions.value.push({ label: 'more...', value: '' })
  }
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    if (tabsetSelectionOptions.value.length > 1) {
      tabsetSelectionOptions.value.push({ label: '', value: '', disable: true })
    }
    tabsetSelectionOptions.value.push({ label: 'Select Space...', value: 'select-space', icon: 'o_space_dashboard' })
  }

  if (tabsetsAdded) {
    tabsetSelectionOptions.value.unshift({
      label: 'Switch to:',
      value: '',
      icon: 'o_featured_play_list',
      disable: true,
    })
  }

  tabsetSelectionModel.value = {
    label: currentTabset.value?.name || '?',
    value: currentTabset.value?.id || '-',
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  if (currentTabset.value) {
    overlap.value = useTabsStore2().getOverlap(currentTabset.value)
    overlapTooltip.value = `${Math.round(100 * overlap.value)}% overlap between this tabset and the currently open tabs`
  } else {
    redirectOnEmpty()
  }
})

const thresholdStyle = () => 'color: hsl(' + Math.round(120 * overlap.value) + ' 80% 50%)'

watchEffect(() => {
  const windowId = useWindowsStore().currentBrowserWindow?.id || 0
  currentChromeTab.value = useTabsStore2().getCurrentChromeTab(windowId) || useTabsStore2().currentChromeTab
})

watchEffect(() => {
  annimateNewTabsetButton.value = useUiStore().animateNewTabsetButton
})

watchEffect(() => {
  if (props.showSearchBox && !searching.value) {
    searching.value = true
  }
})

watchEffect(() => {
  showFilter.value = useUiStore().sidePanelActiveViewIs(SidePanelViews.TABS_LIST) && useUiStore().toolbarFilter
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const title = (): string => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return useSpacesStore().space ? useSpacesStore().space.label : t('no_space_selected')
  } else {
    const currentTs = useTabsetsStore().getCurrentTabset
    if (currentTs) {
      switch (currentTs.type) {
        case TabsetType.SESSION:
          return `Session (${currentTs.tabs.length} tab${currentTs.tabs.length > 1 ? 's' : ''})`
        default:
          switch (currentTs.sharing.sharing) {
            case TabsetSharing.UNSHARED:
              return 'Tabset'
            case TabsetSharing.PUBLIC_LINK:
              return 'Shared Tabset'
            case TabsetSharing.PUBLIC_LINK_OUTDATED:
              return 'Shared Tabset'
            case TabsetSharing.USER:
              return currentTs.sharing.shareReference ? 'Shared Tabset' : 'Sharing Tabset'
            default:
              return 'Tabset'
          }
      }
    }
    return 'Tabset'
  }
}

function getActiveFolder(tabset: Tabset) {
  return tabset.folderActive ? useTabsetService().findFolder([tabset], tabset.folderActive) : undefined
}

const handleButtonClicked = async (tabset: Tabset, args: ActionHandlerButtonClickedHolder, folder?: Tabset) => {
  const useFolder: Tabset | undefined = folder ? folder : getActiveFolder(tabset)
  //console.log(`button clicked: tsId=${tabset.id}, folderId=${useFolder?.id}, args=...`)
  await useActionHandlers(undefined).handleClick(tabset, currentChromeTab.value!, args, useFolder)
}

const offsetTop = () => ($q.platform.is.capacitor || $q.platform.is.cordova ? 'margin-top:40px;' : '')

const addUrlDialog = () => $q.dialog({ component: AddUrlDialog })

const switchTabset = async (tabset: object) => {
  const tsId = tabset['value' as keyof object]
  if (tsId === 'select-space') {
    await router.push('/sidepanel/spaces')
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
  return 'Tabset'
}

const showTabsetSelection = () => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    return true
  }
  return (
    tabsets.value
      .filter((ts: Tabset) => ts.status !== TabsetStatus.ARCHIVED)
      .filter((ts: Tabset) => ts.type !== TabsetType.SPECIAL).length > 1
  )
}
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 3.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.q-list--dense > .q-item,
.q-item--dense {
  min-height: 32px;
}
</style>
