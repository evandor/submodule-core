<template>
  <div class="q-ma-none">
    <q-toolbar>
      <div class="row fit">
        <q-toolbar-title>
          <div class="row">
            <div class="col-2">
              <q-icon name="chevron_left" class="cursor-pointer" @click="router.push('/sidepanel/byDomainList')">
                <q-tooltip>Back</q-tooltip>
              </q-icon>
            </div>
            <div class="col-10">
              <div class="col-1">
                <span class="text-primary"> {{ domain }} </span>
              </div>
            </div>
            <div class="col-1 text-right"></div>
          </div>
        </q-toolbar-title>
      </div>
    </q-toolbar>

    <div class="row q-ma-none">
      <div class="col-12">
        <PanelTabList :tabs="groupedTabs as Tab[]" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash'
import Analytics from 'src/core/utils/google-analytics'
import PanelTabList from 'src/tabsets/layouts/PanelTabList.vue'
import { Tab } from 'src/tabsets/models/Tab'
import { Tabset, TabsetStatus } from 'src/tabsets/models/Tabset'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'
import { onMounted, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const domain = ref(null as unknown as string)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelByDomainPage', document.location.href)
})

watchEffect(() => {
  domain.value = route.params.encodedUrl as string
  if (domain.value) {
    domain.value = atob(domain.value)
  }
  console.log('domain', domain.value)
})

const groupedTabs = ref<Tab[]>([])

watchEffect(() => {
  console.log('checkin tabs2....')
  const allTabs: Tab[] = _.orderBy(
    _.filter(
      _.flatMap(
        _.filter(
          _.map([...useTabsetsStore().tabsets.values()] as Tabset[], (ts: Tabset) => ts),
          (ts: Tabset) => ts.status === TabsetStatus.DEFAULT || ts.status === TabsetStatus.FAVORITE,
        ),
        (ts: Tabset) => ts.tabs,
      ),
      (t: Tab) => true,
    ),
    (t: Tab) => t.activatedCount,
    ['desc'],
  )
  groupedTabs.value = _.filter(allTabs, (t: Tab) => {
    if (t.url) {
      try {
        const hostname = new URL(t.url).hostname
        const splits = hostname.split('.')
        switch (splits.length) {
          case 3:
            return hostname.substring(1 + hostname.indexOf('.')) === domain.value
          default:
            return hostname === domain.value
        }
      } catch (e) {
        return false
      }
    } else {
      return false
    }
  })
})
</script>

<style lang="sass" scoped>

.lightgrey
  background-color: $lightgrey

.greyBorderTop
  border-top: 1px solid $bordergrey
</style>
