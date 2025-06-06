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
        <transition
          :name="showDocumentation ? 'q-transition--scale' : 'q-transition--scale'"
          :class="showDocumentation ? 'documentation' : 'box'">
          <q-card v-if="!showDocumentation" class="fit">
            <q-card-section class="q-pb-none text-center">
              <div class="row">
                <div class="col-11">
                  <div class="text-h6 q-mb-sm">{{ $t('create_your_first_ts') }}</div>
                </div>
                <div class="col text-right">
                  <q-icon
                    name="sym_o_help"
                    class="cursor-pointer"
                    @click="toggleDocumentation"
                    size="xs"
                    color="warning" />
                </div>
              </div>

              <q-input
                v-model="tabsetName"
                id="addTabsetSubmitBtn"
                class="input-box"
                autofocus
                ref="tabsetNameRef"
                :error-message="$t('no_special_chars_and_length')"
                :error="!newTabsetNameIsValid()"
                data-testid="newTabsetName"
                @keydown.enter="addFirstTabset()"
                hint="e.g. Music, Holidays, News..."
                label-color="grey"
                :label="$t('tabset_name')" />
            </q-card-section>
            <q-card-section class="q-ml-sm q-pl-none text-grey-8 text-body1 text-center">
              <q-checkbox
                v-model="addCurrentTabs"
                :label="$t('add_current_tabs', { count: openTabsCount })"
                size="xs"
                class="text-grey"
                color="text-grey-8" />
            </q-card-section>
            <q-card-actions align="center" class="q-pr-md q-pb-xs q-ma-none q-my-none">
              <DialogButton
                :label="$t('add_tabset')"
                @was-clicked="addFirstTabset"
                :color="$q.dark.isActive ? '' : ''"
                :text-color="$q.dark.isActive ? 'warning' : 'primary'"
                :disable="tabsetName.trim().length === 0 || !newTabsetNameIsValid()" />
            </q-card-actions>
            <q-card-section align="center" class="q-pr-md q-pb-none q-ma-none q-mt-sm" style="min-height: 95px">
              <div v-if="addCurrentTabs" class="text-body2 text-grey">
                Your new tabset will contain all open tabs.<br />
                Closing a tab will not delete it from the set.<br />
              </div>
              <div v-else>&nbsp;</div>
            </q-card-section>
            <!--              <q-card-section align="center" class="q-pr-md q-pb-md q-ma-none q-mt-none">-->
            <!--                <div-->
            <!--                  class="text-center q-ma-none q-pa-none text-accent cursor-pointer"-->
            <!--                  style="font-size: smaller"-->
            <!--                  @click="importFromBackup()">-->
            <!--                  or import from backup...-->
            <!--                </div>-->
            <!--              </q-card-section>-->
          </q-card>

          <!-- documentation -->
          <q-card v-else class="my-card fit" :class="showDocumentation ? 'documentation' : 'box'">
            <q-card-section class="q-pb-none">
              <div class="q-row">
                <div class="q-col text-h6 text-center">Thank you for choosing Tabsets - we appreciate it</div>
              </div>
              <div class="q-row q-my-md">
                <div class="q-col text-body1 text-center">Let's begin without further delay!</div>
              </div>
              <div class="q-row q-my-md">
                <div class="q-col text-body1 text-center">
                  Click the button to create your first tabset called 'Getting started'
                </div>
              </div>
              <div class="q-row">
                <div class="q-col text-body1 text-center q-mt-sm">
                  <DialogButton
                    label="ok, let's go"
                    :color="$q.dark.isActive ? '' : 'primary'"
                    :text-color="$q.dark.isActive ? 'warning' : 'white'"
                    @was-clicked="createGettingStartedTabset()"
                    :default-action="true"
                    data-testid="welcome-got-it" />
                </div>
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
        </transition>
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
import DialogButton from 'src/core/dialog/buttons/DialogButton.vue'
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
