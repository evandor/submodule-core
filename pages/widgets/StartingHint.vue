<template>
  <transition appear enter-active-class="animated fadeIn slower delay-5s" leave-active-class="animated fadeOut">
    <div class="q-ma-lg q-mt-xl">
      <div class="row items-center text-grey-5 q-mb-sm">how to start?</div>
      <div class="box" style="min-width: 300px">
        <q-list>
          <q-item clickable @click="useUiStore().startButtonAnimation('addtab')">
            <q-item-section avatar>
              <q-btn outline label="..." size="xs" class="q-mx-none q-px-sm" />
            </q-item-section>

            <q-item-section>
              <q-item-label>Add Tab (or other action)</q-item-label>
              <q-item-label caption
                >Context sensitive menu, e.g. to add the current tab to your tabsets collection.
              </q-item-label>
            </q-item-section>
          </q-item>

          <transition
            v-show="showSettings"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item clickable @click="useUiStore().startButtonAnimation('settings')">
              <q-item-section avatar>
                <SidePanelToolbarButton icon="o_settings" />
              </q-item-section>

              <q-item-section>
                <q-item-label>Settings</q-item-label>
                <q-item-label caption>Click here to activate more features</q-item-label>
              </q-item-section>
            </q-item>
          </transition>

          <template v-if="useTabsStore2().browserTabs.length > 4">
            <transition
              v-show="showOpenTabs"
              appear
              enter-active-class="animated fadeIn slower delay-1s"
              leave-active-class="animated fadeOut">
              <q-item clickable @click="useUiStore().startButtonAnimation('tabsList')">
                <q-item-section avatar>
                  <SidePanelToolbarButton icon="playlist_add" />
                </q-item-section>

                <q-item-section>
                  <q-item-label><span>Open Tabs View</span></q-item-label>
                  <q-item-label caption
                    ><span>Click to show the tabs currently open in your browser</span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </transition>
          </template>

          <transition
            v-show="showBookmarks"
            appear
            enter-active-class="animated fadeIn slower delay-1s"
            leave-active-class="animated fadeOut">
            <q-item
              clickable
              @click="
                useUiStore().startButtonAnimation(
                  useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'bookmarks' : 'settings',
                )
              ">
              <q-item-section avatar>
                <SidePanelToolbarButton
                  icon="bookmark"
                  :color="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'primary' : 'grey-6'" />
              </q-item-section>

              <q-item-section>
                <q-item-label
                  ><span :class="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'text-primary' : 'text-grey-6'"
                    >Bookmarks Manager</span
                  >
                </q-item-label>
                <q-item-label caption
                  ><span :class="useFeaturesStore().hasFeature(FeatureIdent.BOOKMARKS) ? 'text-primary' : 'text-grey-6'"
                    >Click to open the Bookmarks Manager. Available in the settings.</span
                  >
                </q-item-label>
              </q-item-section>
            </q-item>
          </transition>
        </q-list>
      </div>
      <div class="row q-mt-lg">
        <div
          class="col text-body2 text-blue-8 text-center cursor-pointer q-mb-sm"
          @click="useNavigationService().browserTabFor('https://docs.tabsets.net/glossary')">
          Glossary
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { FeatureIdent } from 'src/app/models/FeatureIdent'
import SidePanelToolbarButton from 'src/core/components/SidePanelToolbarButton.vue'
import { useNavigationService } from 'src/core/services/NavigationService'
import { useFeaturesStore } from 'src/features/stores/featuresStore'
import { useTabsStore2 } from 'src/tabsets/stores/tabsStore2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { ref } from 'vue'

const showSettings = ref(false)
const showOpenTabs = ref(false)
const showBookmarks = ref(false)

setTimeout(() => (showSettings.value = true), 4 * 1000)
setTimeout(() => (showOpenTabs.value = true), 7 * 1000)
setTimeout(() => (showBookmarks.value = true), 10 * 1000)
</script>

<style lang="scss" scoped>
.box {
  border: 1px solid $accent;
  border-radius: 10px;
  min-height: 50px;
}
</style>
