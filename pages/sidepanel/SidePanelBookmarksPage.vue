<template>
  <q-page padding style="padding-top: 34px">
    <div class="q-ma-none">
      <div class="q-ma-none">
        <div class="row q-ma-none q-pa-none">
          <div class="col-12 q-mx-sm q-mt-md q-mb-none q-pt-md cursor-pointer text-center" v-if="importedTabsetId">
            <q-btn label="open Imported Tabset" outline @click="openImportedTabset()" />
          </div>
          <div class="col-12 q-ma-none q-pa-none q-pt-md">
            <BookmarksTree
              :nodes="showOnlyFolders ? useBookmarksStore().nonLeafNodes : useBookmarksStore().bookmarksNodes2"
              :show-only-folders="showOnlyFolders"
              :nodes-actions="'import'"
              @imported="(a: any) => imported(a)"
              @toggle-show-only-folders="toggleShowOnlyFolders()"
              :in-side-panel="true" />
          </div>
        </div>
      </div>
    </div>

    <!-- place QPageSticky at end of page -->
    <q-page-sticky expand position="top" class="darkInDarkMode brightInBrightMode">
      <ViewToolbarHelper title="Bookmarks" />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
import BookmarksTree from 'src/bookmarks/components/BookmarksTree.vue'
import { useBookmarksStore } from 'src/bookmarks/stores/bookmarksStore'
import { ExecutionResult } from 'src/core/domain/ExecutionResult'
import ViewToolbarHelper from 'src/core/pages/sidepanel/helper/ViewToolbarHelper.vue'
import { useCommandExecutor } from 'src/core/services/CommandExecutor'
import Analytics from 'src/core/utils/google-analytics'
import { CreateTabsetFromBookmarksRecursive } from 'src/tabsets/commands/CreateTabsetFromBookmarksRecursive'
import { Tabset } from 'src/tabsets/models/Tabset'
import { useTabsetService } from 'src/tabsets/services/TabsetService2'
import { useUiStore } from 'src/ui/stores/uiStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const showOnlyFolders = ref(true)
const importedTabsetId = ref<string | undefined>(undefined)

onMounted(() => {
  Analytics.firePageViewEvent('SidePanelBookmarksPage', document.location.href)
})

const toggleShowOnlyFolders = () => {
  showOnlyFolders.value = !showOnlyFolders.value
}

const imported = async (a: { bmId: number; recursive: boolean; tsName: string }) => {
  console.log('importing bookmarks from', a) // bookmarkId.value, recursive.value)
  useUiStore().importedBookmarks = []
  $q.loadingBar?.start()

  useCommandExecutor()
    .execute(new CreateTabsetFromBookmarksRecursive(a.tsName, '' + a.bmId, a.recursive))
    .then(async (res: ExecutionResult<Tabset>) => {
      const tabset = res.result
      await useTabsetService().saveTabset(tabset)
      $q.loadingBar?.stop()
      // sendMsg('reload-tabset', {tabsetId: tabset.id})
      // sendMsg('sidepanel-switch-view', {view: 'main'})
      console.log('imported to tabset', tabset.id)
      importedTabsetId.value = tabset.id
    })
    .catch((err: any) => {
      console.warn('error', err.toString())
      $q.loadingBar?.stop()
    })
}

const openImportedTabset = () => {
  useTabsetService().selectTabset(importedTabsetId.value)
  router.push('/sidepanel')
}
</script>
