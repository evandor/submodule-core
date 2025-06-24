<template>
  <!-- PopupPage -->
  <q-page class="darkInDarkMode brightInBrightMode" :style="paddingTop" style="min-width: 400px; max-height: 700px">
    <offline-info />

    <PopupInputLine title="Collection" class="q-mt-md">
      <PopupCollectionSelector
        @tabset-changed="tabsetChanged()"
        :show-tabs-count="!currentTabsetHasFolders"
        :url="pageModel.url" />
    </PopupInputLine>

    <PopupInputLine title="Folder" v-if="showFolders()">
      <PopupFolderSelector
        @tabset-changed="tabsetChanged()"
        :show-tabs-count="currentTabsetHasFolders"
        :currentTabset="currentTabset!" />
    </PopupInputLine>

    <!-- Icon, title and description -->
    <div class="row q-ma-sm darkInDarkMode brightInBrightMode q-mt-md">
      <div class="col-2 q-ma-sm">
        <q-img v-if="thumbnail" :src="thumbnail" no-native-menu />
        <q-img v-else :src="browserTab?.favIconUrl" no-native-menu />
      </div>
      <div class="col q-mx-sm">
        <div class="column">
          <div class="col">
            <AutogrowInput
              v-model="pageModel.title"
              :input-class="'text-bold'"
              :class="'ellipsis'"
              :filled="false"
              data-testid="pageModelTitle" />
          </div>
          <div class="col ellipsis-3-lines text-body2">{{ pageModel.description }}</div>
          <!--          <AutogrowInput v-model="pageModel.description" :class="'ellipsis-3-lines'" />-->
        </div>
      </div>
    </div>

    <!-- info label: created, updated, ... -->
    <div class="row q-my-xs" v-if="tab && tab.url == pageModel.url">
      <div class="col text-right text-caption text-grey-8 q-mx-md cursor-pointer" @click="interateThroughInfo">
        {{ infoLabel }}
      </div>
    </div>

    <!-- URL -->
    <PopupInputLine title="URL" class="q-mt-md">
      <AutogrowInput v-model="pageModel.url" :class="'ellipsis'" :filled="true" data-testid="pageModelUrl" />
    </PopupInputLine>

    <!-- Note -->
    <PopupInputLine title="Note">
      <AutogrowInput v-model="pageModel.note" :class="'ellipsis'" :filled="true" data-testid="pageModelNote" />
    </PopupInputLine>

    <!-- Tags -->
    <PopupInputLine title="Tags">
      <q-select
        input-class="q-ma-none q-pa-none"
        borderless
        filled
        dense
        options-dense
        v-model="pageModel.tags"
        use-input
        use-chips
        multiple
        hide-dropdown-icon
        input-debounce="0"
        new-value-mode="add-unique"
        @update:model-value="(val) => updatedTags(val)" />
    </PopupInputLine>

    <!-- Actions -->
    <PopupInputLine title="Actions" class="q-mt-xs" v-if="tab">
      <q-btn icon="o_article" size="sm" outline @click="openAsArticle()" color="grey-7" class="q-mt-xs" />
      <q-btn
        v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML)"
        icon="save"
        size="xs"
        class="cursor-pointer q-px-md q-mr-sm"
        color="primary">
        <q-tooltip :delay="1000">Save a snapshot of this page</q-tooltip>
        <!--          <q-badge v-if="snapshotsSize > 0" floating color="warning" size="xs" text-color="primary">{{-->
        <!--            snapshotsSize-->
        <!--          }}</q-badge>-->
      </q-btn>
    </PopupInputLine>

    <!-- buttons -->
    <div class="row q-my-md darkInDarkMode brightInBrightMode" style="border: 0 solid blue">
      <div class="col-2 q-ml-xs q-mt-sm text-right text-caption text-grey-8" style="border: 0 solid red"></div>
      <div class="col q-mx-md text-right" style="border: 0 solid red">
        <q-btn
          v-if="!tab || tab.url !== pageModel.url"
          style="width: 100px"
          dense
          label="Add"
          color="primary"
          unelevated
          size="15px"
          @click="addTab"
          class="cursor-pointer q-px-md">
        </q-btn>
        <q-btn
          v-else
          style="width: 100px"
          outline
          dense
          label="Delete"
          color="negative"
          unelevated
          size="15px"
          @click="deleteTab"
          class="cursor-pointer q-px-md">
        </q-btn>
      </div>
    </div>

    <template v-if="useSettingsStore().has('DEBUG_MODE')">
      <div class="row q-pa-none q-ma-none fit">
        <div
          class="col-12 q-pa-none q-mx-md q-mt-md q-mb-none text-caption ellipsis-2-lines"
          style="font-size: smaller">
          {{ browserTab?.url }}
        </div>
        <div class="col-12 q-pa-none q-mx-md q-my-none text-caption" style="font-size: smaller">
          {{ useContentStore().getCurrentTabContent?.length }}
        </div>
        <div class="col-12 q-pa-none q-mx-md q-my-none text-caption" style="font-size: smaller">
          {{ useContentStore().currentTabFavIcon }}<br />
          <!-- {{ text }}<br />-->
          <!--          <hr />-->
          <!--          {{ browserTab }}<br />-->
        </div>
      </div>
    </template>

    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode q-ma-none q-ml-md">
      <PopupToolbar title="Tabsets" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { date, LocalStorage, uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import AutogrowInput from 'src/core/pages/popup/helper/AutogrowInput.vue'
import PopupCollectionSelector from 'src/core/pages/popup/PopupCollectionSelector.vue'
import PopupFolderSelector from 'src/core/pages/popup/PopupFolderSelector.vue'
import PopupInputLine from 'src/core/pages/popup/PopupInputLine.vue'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { DeleteTabCommand } from 'src/tabsets/commands/DeleteTabCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, provide, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const thumbnail = ref<string | undefined>(useTabsStore2().currentChromeTab?.favIconUrl)
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 40px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)
const text = ref<string | undefined>(undefined)
const tags = ref<string[]>([])

const infoModes = ['saved', 'updated', 'count', 'lastActive']
const infoMode = ref<string>(infoModes[0]!)

const pageModel = reactive<{
  url: string
  note: string
  tags: string[]
  title: string | undefined
  description: string | undefined
}>({
  url: '',
  note: '',
  tags: [],
  title: undefined,
  description: undefined,
})

let initialNote = ''

const language = ref<string | undefined>(undefined)
const infoLabel = ref('')

provide('ui.density', uiDensity)

onMounted(() => {
  Analytics.firePageViewEvent('PopupPage', document.location.href)
  //switch early
  if (!LocalStorage.getItem('ui.hideWelcomePage')) {
    useRouter().push('/popup/welcome')
  }
})

watchEffect(() => {
  if (!tab.value) {
    return
  }
  console.log('mode set to ', infoMode.value)
  switch (infoMode.value) {
    case 'saved':
      infoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
      break
    case 'updated':
      infoLabel.value = 'Updated ' + date.formatDate(tab.value.updated, 'DD.MM.YY HH:mm')
      break
    case 'count':
      infoLabel.value = `Opened ${tab.value.activatedCount}x`
      break
    case 'lastActive':
      infoLabel.value = 'Updated ' + date.formatDate(tab.value.lastActive, 'DD.MM.YY HH:mm')
      break
  }
})

watchEffect(() => {
  if (tab.value && pageModel.note !== initialNote) {
    infoLabel.value = 'updating...'
    setTimeout(() => {
      if (currentTabset.value) {
        tab.value!.note = pageModel.note
        tab.value!.updated = new Date().getTime()
        useTabsetsStore().saveTabset(currentTabset.value)
        infoLabel.value = 'Updated ' + date.formatDate(tab.value!.updated, 'DD.MM.YY HH:mm')
      }
    }, 1000)
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  browserTab.value = useTabsStore2().currentChromeTab
  if (browserTab.value) {
    //url.value = browserTab.value.url
    pageModel.url = browserTab.value.url || 'https://'
    pageModel.title = browserTab.value.title
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(browserTab.value.url)
    const tabsets = useTabsetService().tabsetsFor(browserTab.value.url!)
    containedInTsCount.value = tabsets.length
    if (currentTabset.value && browserTab.value && browserTab.value.url) {
      tab.value = currentTabset.value.tabs.find((t: Tab) => t.url === browserTab.value!.url)
      if (tab.value) {
        infoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
        initialNote = tab.value.note
        pageModel.note = tab.value.note
      }
    } else {
      //var t = tabsets.map((ts: Tabset) => ts.tabs)
    }
  }
})

watchEffect(() => {
  const article = useContentStore().currentTabArticle
  if (article) {
    console.log('article', article)
    const articleContent = ContentUtils.html2text(article['content' as keyof object])
    //console.log('articleContent', articleContent)
    text.value = articleContent

    if (useFeaturesStore().hasFeature(FeatureIdent.AI) && text.value && text.value.trim().length > 10) {
      console.log('::::', text.value)
      const data = {
        text: 'ich bin ein kurzer Text mit Nachrichen',
        candidates: ['news', 'shopping'],
      }

      chrome.runtime.sendMessage(
        {
          name: 'zero-shot-classification',
          data: data,
        },
        (callback: any) => {
          console.log('got callback!!', callback)
          if (chrome.runtime.lastError) {
            /* ignore */
          }
          if (callback) {
            const labels: string[] = callback['labels'] as string[]
            const scores: number[] = callback['scores'] as number[]
            console.log('adding tags for ', labels, scores)
            labels.forEach((label: string, index: number) => {
              if (scores[index]! >= 0.5) {
                pageModel.tags.push(label)
              }
            })
          }
        },
      )
    }
  }
})

watchEffect(() => {
  const metas = useContentStore().currentTabMetas
  console.log('metas', metas)
  if (metas['description' as keyof object]) {
    pageModel.description = (metas['description' as keyof object] as string | undefined) || ''
    if (
      useFeaturesStore().hasFeature(FeatureIdent.AI) &&
      pageModel.description &&
      pageModel.description.trim().length > 10
    ) {
      console.log(':::', pageModel.description)
      const data = {
        text: 'ich bin ein Text',
        candidates: ['news', 'shopping'],
      }

      chrome.runtime.sendMessage(
        {
          name: 'zero-shot-classification',
          data: data,
        },
        (callback: any) => {
          console.log('got callback!!', callback)
          if (chrome.runtime.lastError) {
            /* ignore */
          }
          if (callback) {
            const labels: string[] = callback['labels'] as string[]
            const scores: number[] = callback['scores'] as number[]
            console.log('adding tags for ', labels, scores)
            if (labels && labels.length > 0) {
              labels.forEach((label: string, index: number) => {
                if (scores[index]! >= 0.5) {
                  tags.value.push(label)
                }
              })
            }
          }
        },
      )

      try {
        // @ts-expect-error xxx
        LanguageDetector.create().then((detector: any) => {
          detector.detect(pageModel.description).then((results: any[]) => {
            for (const result of results) {
              console.log(result.detectedLanguage, result.confidence)
            }
            if (results.length > 0) {
              language.value = results[0].detectedLanguage
              tags.value.push(results[0].detectedLanguage)
            }
          })
        })
      } catch (e) {
        console.log('error with language detection')
      }
    }
  }
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
})

watchEffect(() => {
  tabsetsLastUpdate.value = useTabsetsStore().lastUpdate
})

watchEffect(() => {
  if (tab.value) {
    useThumbnailsService()
      .getThumbnailFor(tab.value.id, useAuthStore().user.uid)
      .then((data) => {
        if (data) {
          //console.log('setting thumbnail to ', data)
          thumbnail.value = data
        } else {
          //thumbnail.value = ''
        }
      })
  }
})

const tabsetChanged = () => (currentTabset.value = useTabsetsStore().getCurrentTabset)

const updatedTags = (val: string[]) => {
  console.log('updating tag', val, useTabsetsStore().getCurrentTabset)
  if (tab.value) {
    // tab.value.tags = val
    // useTabsetService()
    //   .saveCurrentTabset()
    //   .then(() => {
    //     sendMsg('refresh-store')
    //     // all those did not work:
    //     // chrome.runtime.sendMessage(null, { message: 'refresh-store' }, function (response) {...
    //     // BexFunctions.bexSendWithRetry($q, 'reload-current-tabset', 'background')
    //     // useTabsetsStore().reloadTabset(currentTabset.value!.id)
    //   })
    //   .catch((err) => console.error(err))
  }
}

const openAsArticle = () => {
  if (tab.value) {
    useNavigationService().browserTabFor(
      chrome.runtime.getURL(`/www/index.html#/mainpanel/readingmode/${tab.value.id}`),
    )
  }
}
const addTab = () => {
  console.log('hier', browserTab.value)
  // validation?
  if (browserTab.value) {
    const newTab: Tab = new Tab(uid(), browserTab.value)
    newTab.url = pageModel.url
    newTab.note = pageModel.note
    newTab.description = pageModel.description || ''
    newTab.tags = pageModel.tags
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(newTab, currentTabset.value)) //, props.folder?.id))
  }
}

const deleteTab = () => {
  if (tab.value && currentTabset.value) {
    useCommandExecutor().executeFromUi(new DeleteTabCommand(tab.value, currentTabset.value))
  }
}

const interateThroughInfo = () => {
  const currentIndex = infoModes.indexOf(infoMode.value)
  const nextIndex = (currentIndex + 1) % infoModes.length
  infoMode.value = infoModes[nextIndex]!
}

const currentTabsetHasFolders = () =>
  currentTabset.value && currentTabset.value.folders && currentTabset.value.folders.length > 0

const showFolders = () =>
  useFeaturesStore().hasFeature(FeatureIdent.FOLDER) && currentTabsetHasFolders() && currentTabset
</script>

<!--<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />-->
