import { useContentStore } from 'src/content/stores/contentStore'
import { ContentItem } from 'src/content/models/ContentItem'
import { useContentService } from 'src/content/services/ContentService'
import ContentUtils from 'src/core/utils/ContentUtils'

class BexFunctions {

  handleBexTabExcerpt = async ({ from, to, event, payload }: {
    from: string,
    to: string,
    event: string,
    payload: object
  }) => {
    console.log(`[BEX-APP] ${event} <<<`, from, to, payload)

    // updating (transient) content in contentStore
    useContentStore().setCurrentTabContent(payload['html' as keyof object])
    useContentStore().setCurrentTabMetas(payload['metas' as keyof object])
    useContentStore().setCurrentTabUrl(payload['url' as keyof object])

    // update (persistent) content in content db if exists
    const existing: ContentItem | undefined = await useContentService().getContentFor(payload['url' as keyof object])
    if (existing) {
      const tokens = ContentUtils.html2tokens(payload['html' as keyof object] || '')
      useContentService().saveContent(existing.id, payload['url' as keyof object], [...tokens].join(' '), payload['metas' as keyof object], 'title...', [])
        .catch((err: any) => console.log('err', err))
    }
  }

}

export default new BexFunctions()
