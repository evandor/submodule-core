<template>
  <q-page padding style="padding-top: 45px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-ma-none q-pa-none q-pt-lg">
            <div class="col-12 q-pa-xs items-center justify-center" v-for="rssTab in rssTabs">
              <q-card flat @click="open(rssTab)">
                <q-card-section class="q-pt-xs cursor-pointer">
                  <div class="row items-baseline">
                    <div class="col-2">
                      <TabFaviconWidget :tab="rssTab" width="20px" height="20px" />
                    </div>
                    <div class="col-9 text-body2 ellipsis">
                      {{ rssTab.title }}
                    </div>
                    <div class="col-1">
                      <q-icon name="close" />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="RSS Feeds" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useNotificationHandler } from 'src/core/services/ErrorHandler'
import { useUtils } from 'src/core/services/Utils'
import Analytics from 'src/core/utils/google-analytics'
import { Tab } from 'src/tabsets/models/Tab'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import TabFaviconWidget from 'src/tabsets/widgets/TabFaviconWidget.vue'
import { onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

const { handleError, handleSuccess } = useNotificationHandler()
const { inBexMode } = useUtils()

const router = useRouter()

const tags = ref<Map<string, number>>(new Map())
const $q = useQuasar()
const localStorage = $q.localStorage

const rssTabs = ref<Tab[]>([])

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelRssListViewer', document.location.href)
})

watchEffect(() => (rssTabs.value = useTabsetsStore().rssTabs))

const open = (tab: Tab) => {
  if (tab.url) {
    router.push('/sidepanel/rss/' + btoa(tab.url))
  }
}
</script>
