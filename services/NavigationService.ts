export function useNavigationService() {
  const placeholderPattern = /\${[^}]*}/gm

  const init = async () => {}

  const browserTabFor = async (url: string): Promise<chrome.tabs.Tab> => {
    url = url.replace(placeholderPattern, '')
    console.log(` > opening url '${url}' in current window`)

    // getting all tabs from this window
    const tabsFromBrowser: chrome.tabs.Tab[] = await chrome.tabs.query({ currentWindow: true }) // url in queryInfo ignores fragments!
    const tabs = tabsFromBrowser.filter((t: chrome.tabs.Tab) => t.url === url)
    if (tabs.length === 0) {
      console.debug('tab not found, creating new one:', url)
      const createdTab = await chrome.tabs.create({
        active: true,
        pinned: false,
        url: url,
      })
      return Promise.resolve(createdTab)
    }
    if (tabs.length > 1) {
      console.log('found multiple tabs: ', tabs)
      console.log('tabsFromBrowser', tabsFromBrowser)
    }
    //console.log("found one tab:", tabs[0])
    await chrome.tabs.update(tabs[0]!.id!, { active: true })
    return Promise.resolve(tabs[0]!)
  }

  return {
    init,
    browserTabFor,
  }
}
