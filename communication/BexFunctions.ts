import { ContentItem } from 'src/content/models/ContentItem'
import { TabReference, TabReferenceType } from 'src/content/models/TabReference'
import { useContentService } from 'src/content/services/ContentService'
import { useContentStore } from 'src/content/stores/contentStore'
import ContentUtils from 'src/core/utils/ContentUtils'
import { TabAndTabsetId } from 'src/tabsets/models/TabAndTabsetId'
import { useTabsetsStore } from 'src/tabsets/stores/tabsetsStore'

class BexFunctions {
  handleBexTabExcerpt = async ({
    from,
    to,
    event,
    payload,
  }: {
    from: string
    to: string
    event: string
    payload: object
  }) => {
    console.log(`[BEX-APP] ${event} <<< html#:${((payload['html' as keyof object] as string) || '').length}`)

    const theUrl = payload['url' as keyof object] as string

    // updating (transient) content in contentStore
    useContentStore().setCurrentTabUrl(theUrl)
    useContentStore().setCurrentTabContent(payload['html' as keyof object])
    useContentStore().setCurrentTabMetas(payload['metas' as keyof object])

    // update (persistent) content in content db if exists
    const existing: ContentItem | undefined = await useContentService().getContentFor(theUrl)
    if (existing) {
      const tokens = ContentUtils.html2tokens(payload['html' as keyof object] || '')
      useContentService()
        .saveContent(existing.id, theUrl, [...tokens].join(' '), payload['metas' as keyof object], 'title...', [])
        .catch((err: any) => console.log('err', err))
    }

    // update existing tabs with this url
    const newTabReferences: TabReference[] = useContentStore().getCurrentTabReferences
    useTabsetsStore()
      .tabsForUrl(theUrl)
      .forEach((tabAndTsId: TabAndTabsetId) => {
        const ts = useTabsetsStore().getTabset(tabAndTsId.tabsetId)
        if (ts) {
          // console.log(`setting tabReferences for tab url '${tabAndTsId.tab.url}' to ${JSON.stringify(currentTabReferences.value)}`)
          const originalRefs = tabAndTsId.tab.tabReferences

          newTabReferences
            .filter((tr: TabReference) => tr.type === TabReferenceType.RSS)
            .forEach((rssRef: TabReference) => {
              const existingIndex = originalRefs.findIndex((r: TabReference) => r.href === rssRef.href)
              if (existingIndex >= 0) {
                rssRef = originalRefs[existingIndex] as TabReference
              }
            })

          tabAndTsId.tab.tabReferences = newTabReferences
          useTabsetsStore().saveTabset(ts)
        }
      })
  }
}

export default new BexFunctions()
