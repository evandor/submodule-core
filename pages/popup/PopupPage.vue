<template>
  <!-- PopupPage -->
  <q-page
    class="darkInDarkMode brightInBrightMode"
    :style="paddingTop"
    style="min-width: 400px; min-height: 380px; max-height: 700px">
    <offline-info />

    <PopupInputLine title="Tabsets" class="q-mt-md">
      <PopupCollectionSelector @tabset-changed="tabsetChanged()" :tab :url />
    </PopupInputLine>

    <div class="row q-ma-sm darkInDarkMode brightInBrightMode">
      <div class="col-2 q-ma-sm">
        <q-img v-if="thumbnail" :src="thumbnail" no-native-menu />
        <q-img v-else :src="browserTab?.favIconUrl" no-native-menu />
      </div>
      <div class="col q-mx-sm">
        <div class="column">
          <div class="col">
            {{ browserTab?.title }}
          </div>
          <div class="col ellipsis-3-lines text-body2">{{ description }}</div>
        </div>
      </div>
    </div>

    <div class="row q-my-xs" v-if="tab && tab.url == url">
      <div class="col text-right text-caption text-grey-8 q-mx-md">
        {{ timeInfoLabel }}
      </div>
    </div>

    <PopupInputLine title="URL" class="q-mt-md">
      <q-input
        v-model="url"
        type="text"
        dense
        filled
        class="text-body2 ellipsis"
        :autogrow="urlActive"
        @click="urlActive = true"
        @blur="urlActive = false"></q-input>
    </PopupInputLine>

    <PopupInputLine title="Note">
      <q-input v-model="note" type="text" autogrow dense class="text-body2" filled></q-input>
    </PopupInputLine>

    <PopupInputLine title="Tags">
      <q-select
        input-class="q-ma-none q-pa-none"
        borderless
        filled
        dense
        options-dense
        v-model="tags"
        use-input
        use-chips
        multiple
        hide-dropdown-icon
        input-debounce="0"
        new-value-mode="add-unique"
        @update:model-value="(val) => updatedTags(val)" />
    </PopupInputLine>

    <div class="row q-my-xs darkInDarkMode brightInBrightMode" style="border: 0 solid blue">
      <div class="col-2 q-ml-xs q-mt-sm text-right text-caption text-grey-8" style="border: 0 solid red"></div>
      <div class="col q-mx-md text-right" style="border: 0 solid red">
        <q-btn
          style="width: 100px"
          outline
          label="Add"
          color="primary"
          unelevated
          size="15px"
          @click="addTab"
          class="cursor-pointer q-px-md">
        </q-btn>
      </div>
    </div>

    <PopupInputLine title="Actions" class="q-mt-md" v-if="tab">
      <q-btn icon="o_article" size="sm" outline @click="openAsArticle()" color="grey-7" class="q-mt-xs" />
      <q-btn
        v-if="useFeaturesStore().hasFeature(FeatureIdent.SAVE_MHTML)"
        icon="save"
        outline
        size="xs"
        class="cursor-pointer q-px-md q-mr-sm"
        color="primary">
        <q-tooltip :delay="1000">Save a snapshot of this page</q-tooltip>
        <!--          <q-badge v-if="snapshotsSize > 0" floating color="warning" size="xs" text-color="primary">{{-->
        <!--            snapshotsSize-->
        <!--          }}</q-badge>-->
      </q-btn>
    </PopupInputLine>

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

    <q-page-sticky
      expand
      position="top"
      class="darkInDarkMode brightInBrightMode"
      :class="uiDensity === 'dense' ? 'q-mx-none' : 'q-ma-md'">
      <PopupToolbar @tabset-changed="tabsetChanged()" :tab :url :disable="false" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import _ from 'lodash'
import { date, LocalStorage, uid } from 'quasar'
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import { useContentStore } from 'src/content/stores/contentStore'
import OfflineInfo from 'src/core/components/helper/offlineInfo.vue'
import PopupCollectionSelector from 'src/core/pages/popup/PopupCollectionSelector.vue'
import PopupInputLine from 'src/core/pages/popup/PopupInputLine.vue'
import PopupToolbar from 'src/core/pages/popup/PopupToolbar.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useSettingsStore } from 'src/core/stores/settingsStore'
import ContentUtils from 'src/core/utils/ContentUtils'
import Analytics from 'src/core/utils/google-analytics'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useSpacesStore } from 'src/spaces/stores/spacesStore'
import { AddTabToTabsetCommand } from 'src/tabsets/commands/AddTabToTabsetCommand'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useThumbnailsService } from 'src/thumbnails/services/ThumbnailsService'
import { UiDensity, useUiStore } from 'src/ui/stores/uiStore'
import { useAuthStore } from 'stores/authStore'
import { onMounted, provide, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const showStartingHint = ref(true)
const thumbnail = ref<string | undefined>(useTabsStore2().currentChromeTab?.favIconUrl)
const tabsets = ref<Tabset[]>([])
const currentTabset = ref<Tabset | undefined>(undefined)
const browserTab = ref<chrome.tabs.Tab | undefined>(undefined)
const tab = ref<Tab | undefined>(undefined)
const tabsetsLastUpdate = ref(0)
const paddingTop = ref('padding-top: 80px')
const uiDensity = ref<UiDensity>(useUiStore().uiDensity)
const alreadyInTabset = ref<boolean>(false)
const containedInTsCount = ref(0)
const note = ref('')
const text = ref<string | undefined>(undefined)
const tags = ref<string[]>([])

let initialNote = ''

const url = ref<string | undefined>(undefined)
const urlActive = ref(false)

const description = ref<string | undefined>(undefined)

const language = ref<string | undefined>(undefined)
const timeInfoLabel = ref('')

provide('ui.density', uiDensity)

function updateOnlineStatus(e: any) {
  const { type } = e
  useUiStore().networkOnline = type === 'online'
}

onMounted(() => {
  window.addEventListener('offline', (e) => updateOnlineStatus(e))
  window.addEventListener('online', (e) => updateOnlineStatus(e))

  Analytics.firePageViewEvent('PopupPage', document.location.href)

  //switch early
  if (!LocalStorage.getItem('ui.hideWelcomePage')) {
    useRouter().push('/popup/welcome')
  }
})

watchEffect(() => {
  if (tab.value && note.value !== initialNote) {
    timeInfoLabel.value = 'updating...'
    setTimeout(() => {
      if (currentTabset.value) {
        tab.value!.note = note.value
        tab.value!.updated = new Date().getTime()
        useTabsetsStore().saveTabset(currentTabset.value)
        timeInfoLabel.value = 'Updated ' + date.formatDate(tab.value!.updated, 'DD.MM.YY HH:mm')
      }
    }, 1000)
  }
})

watchEffect(() => {
  showStartingHint.value =
    !useUiStore().appLoading &&
    currentTabset.value?.name === 'My first Tabset' &&
    !LocalStorage.getItem('ui.hideStartingHint')
})

watchEffect(() => {
  tags.value = []
})

watchEffect(() => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
  browserTab.value = useTabsStore2().currentChromeTab
  if (browserTab.value) {
    url.value = browserTab.value.url
    alreadyInTabset.value = useTabsetService().urlExistsInCurrentTabset(browserTab.value.url)
    const tabsets = useTabsetService().tabsetsFor(browserTab.value.url!)
    containedInTsCount.value = tabsets.length
    if (currentTabset.value && browserTab.value && browserTab.value.url) {
      tab.value = currentTabset.value.tabs.find((t: Tab) => t.url === browserTab.value!.url)
      if (tab.value) {
        timeInfoLabel.value = 'Saved ' + date.formatDate(tab.value.created, 'DD.MM.YY HH:mm')
        initialNote = tab.value.note
        note.value = tab.value.note
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
                tags.value.push(label)
              }
            })
          }
        },
      )
      // const data = {
      //   text: text.value,
      //   candidates: ['news'],
      // }
      // console.log('about to apply KI logic on meta description...', data)
      // //sendMsg('zero-shot-classification', data)
      //
      // chrome.runtime.sendMessage(
      //   {
      //     name: 'zero-shot-classification',
      //     data: data,
      //   },
      //   (callback: any) => {
      //     console.log('got callback!', callback)
      //     if (chrome.runtime.lastError) {
      //       /* ignore */
      //     }
      //     const tabsetScores: object[] = []
      //     // if (callback.scores) {
      //     //   callback.scores.forEach((score: number, index: number) => {
      //     //     console.log("got score", score)
      //     //     if (score > .1) {
      //     //       tabsetScores.push({
      //     //         score: score,
      //     //         candidateName: candidates[index].name,
      //     //         candidateId: candidates[index].id
      //     //       })
      //     //     }
      //     //   })
      //     //   // force reload in other pages (like CurrentTabElementHelper)
      //     //   // TODO check
      //     //   //useTabsStore().setCurrentChromeTab(tab)
      //     // }
      //   },
      // )
      // classification(text.value).then((res: any) => console.log('hier!!!', res))
      // try {
      //   // @ts-expect-error xxx
      //   Summarizer.create().then((summarizer: any) => {
      //     summarizer.summarize(text.value).then((results: string) => {
      //       console.log(results)
      //       text.value = results
      //     })
      //   })
      // } catch (e) {
      //   console.log('error with language detection')
      // }
    }
  }
})

watchEffect(() => {
  const metas = useContentStore().currentTabMetas
  console.log('metas', metas)
  if (metas['description' as keyof object]) {
    description.value = metas['description' as keyof object] as string | undefined
    if (useFeaturesStore().hasFeature(FeatureIdent.AI) && description.value && description.value.trim().length > 10) {
      console.log(':::', description.value)
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
          detector.detect(description.value).then((results: any[]) => {
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
    // TabsetService.getContentFor(tab.value as Tab).then((data) => {
    //   if (data) {
    //     content.value = data['content' as keyof object]
    //     //metas.value = data['metas' as keyof object]
    //     metaRows.value = []
    //     _.forEach(Object.keys(data['metas' as keyof object]), (k: any) => {
    //       //console.log("k", k, data.metas[k])
    //       metaRows.value.push({
    //         name: k,
    //         value: data['metas' as keyof object][k],
    //       })
    //     })
    //     metaRows.value = _.sortBy(metaRows.value, (s: any) => s['name' as keyof object])
    //   }
    // })
    // useSnapshotsService()
    //   .getMetadataFor(tab.value.id)
    //   .then((mds: BlobMetadata[]) => {
    //     htmls.value = mds
    //   })
  }
})

const getTabsetOrder = [
  function (o: Tabset) {
    return !o || o.status === TabsetStatus.FAVORITE ? 0 : 1
  },
  function (o: Tabset) {
    return o.name?.toLowerCase()
  },
]

function determineTabsets() {
  return _.sortBy(
    _.filter(
      [...useTabsetsStore().tabsets.values()] as Tabset[],
      (ts: Tabset) =>
        ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED,
    ),
    getTabsetOrder,
    ['asc'],
  )
}

watchEffect(() => {
  if (useFeaturesStore().hasFeature(FeatureIdent.SPACES)) {
    const currentSpace = useSpacesStore().space
    tabsets.value = _.sortBy(
      _.filter([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => {
        if (currentSpace) {
          if (ts.spaces.indexOf(currentSpace.id) < 0) {
            return false
          }
        }
        return (
          ts.status !== TabsetStatus.DELETED && ts.status !== TabsetStatus.HIDDEN && ts.status !== TabsetStatus.ARCHIVED
        )
      }),
      getTabsetOrder,
      ['asc'],
    )
  } else {
    tabsets.value = determineTabsets()
  }
})

const tabsetChanged = () => {
  currentTabset.value = useTabsetsStore().getCurrentTabset
}

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
  if (browserTab.value) {
    const newTab: Tab = new Tab(uid(), browserTab.value)
    useCommandExecutor().executeFromUi(new AddTabToTabsetCommand(newTab, currentTabset.value)) //, props.folder?.id))
  }
}
</script>

<style lang="scss" src="src/pages/css/sidePanelPage2.scss" />
