<template>
  <q-page>
    <div v-if="showWatermark" id="watermark">{{ watermark }}</div>

    <div class="q-ma-none q-pa-md fit">
      <div class="row q-mt-lg q-ml-sm">
        <div class="row fit">
          <div class="col-12 text-body2 text-center">The Art Of Linking</div>
        </div>
        <div class="col-12 text-h6 q-mb-md text-primary text-center">{{ $t('welcome_to_tabsets') }}</div>
      </div>

      <div
        class="q-pa-none q-ma-sm row items-start relative-position overflow-hidden cursor-pointer non-selectable"
        @click.stop="selected()">
        <!-- documentation -->
        <q-card class="my-card fit documentation">
          <q-card-section class="q-pb-none">
            <div class="q-row">
              <div class="q-col text-h6 text-center">Thank you for choosing Tabsets - we appreciate it</div>
            </div>
            <div class="q-row q-my-md">
              <div class="q-col text-body1 text-center">
                To get started with tabsets, please click on the Tabsets Icon to open the popup window.
              </div>
            </div>
            <div class="q-row">
              <div class="q-col text-body1 text-center q-mt-sm"></div>
            </div>
            <div class="q-row q-mt-lg">
              <div
                class="col text-body2 text-blue-8 text-center cursor-pointer q-mb-sm"
                @click="useNavigationService().browserTabFor('https://youtu.be/jxOonJ_x7Eg')">
                Introduction Video
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="row q-mr-sm">
        <div class="col-12 text-center">
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/privacy')"
            >Privacy</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://tabsets.web.app/#/tos')"
            >Terms of Service</span
          >
          <span class="q-ma-none q-pa-none q-mx-xs text-grey-5">|</span>
          <span
            class="text-grey q-mx-none cursor-pointer"
            style="font-size: smaller"
            @click.stop="clicked('https://docs.tabsets.net')"
            >Documentation</span
          >
        </div>
      </div>
    </div>
  </q-page>
</template>

<script lang="ts" setup>
import { LocalStorage, openURL } from 'quasar'
import BrowserApi from 'src/app/BrowserApi'
import { SidePanelViews } from 'src/app/models/SidePanelViews'
import { STRIP_CHARS_IN_USER_INPUT, TITLE_IDENT } from 'src/boot/constants'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import { useNavigationService } from 'src/core/services/NavigationService'
import Analytics from 'src/core/utils/google-analytics'
import { CreateTabsetCommand } from 'src/tabsets/commands/CreateTabsetCommand'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const tabsetName = ref('')
const tabsetNameRef = ref<HTMLElement>(null as unknown as HTMLInputElement)
const windowLocation = ref('---')
const login = ref(false)
const addCurrentTabs = ref(false)
const showWatermark = ref(false)
const watermark = ref('')
const showDocumentation = ref(true)
const openTabsCount = ref(0)

onMounted(() => {
  Analytics.firePageViewEvent('WelcomePage', document.location.href)
  windowLocation.value = window.location.href
  LocalStorage.set(TITLE_IDENT, 'Tabsets' + stageIdentifier())
})

const toggleDocumentation = () => (showDocumentation.value = !showDocumentation.value)

const createGettingStartedTabset = () => {
  const tab1 = BrowserApi.createChromeTabObject('Getting Started', 'https://docs.tabsets.net/get-started')
  const tab2 = BrowserApi.createChromeTabObject('Release Notes', 'https://docs.tabsets.net/release-notes')

  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand('My first Tabset', [tab1, tab2]))
    .then(() => {
      router.push('/sidepanel')
      //useNavigationService().browserTabFor('https://docs.tabsets.net/get-started')
    })
}

watchEffect(() => {
  openTabsCount.value = useTabsStore2().browserTabs.length
})

watchEffect(() => {
  // we might have been redirected here too early, redirecting
  // back as soon we know we actually do have some tabsets
  if (useTabsetsStore().tabsets.size > 0) {
    //console.log('routing back! We have tabsets!')
    router.back()
  }
})

watchEffect(() => {
  showWatermark.value = useUiStore().getWatermark().length > 0
  watermark.value = useUiStore().getWatermark()
})

const addFirstTabset = () => {
  useCommandExecutor()
    .executeFromUi(new CreateTabsetCommand(tabsetName.value, addCurrentTabs.value ? useTabsStore2().browserTabs : []))
    .then((res: any) => {
      useUiStore().sidePanelSetActiveView(SidePanelViews.MAIN)
      router.push('/sidepanel?first=true')
    })
}

const newTabsetNameIsValid = () => tabsetName.value.length <= 32 && !STRIP_CHARS_IN_USER_INPUT.test(tabsetName.value)

//https://groups.google.com/a/chromium.org/g/chromium-extensions/c/nb058-YrrWc
const selected = () => tabsetNameRef.value?.focus()

const stageIdentifier = () => (process.env.TABSETS_STAGE !== 'PRD' ? ' (' + process.env.TABSETS_STAGE + ')' : '')

const clicked = (url: string) => openURL(url)

const importFromBackup = () => {
  const url = chrome.runtime.getURL('/www/index.html#/mainpanel/settings?tab=importExport')
  useNavigationService().browserTabFor(url)
}
</script>
