export function useNavigationService() {

  const placeholderPattern = /\${[^}]*}/gm

  const init = async () => {
  }

  const browserTabFor = async (url: string): Promise<chrome.tabs.Tab> => {
    url = url.replace(placeholderPattern, "");
    console.log(` > opening url ${url} in current window`)


    // getting all tabs from this window
    const tabs: chrome.tabs.Tab[] = (await chrome.tabs.query({})) // url in queryInfo ignores fragments!
      .filter((t:chrome.tabs.Tab) => t.url === url)
    if (tabs.length === 0) {
      console.debug("tab not found, creating new one:", url)
      const createdTab = await chrome.tabs.create({
        active: true,
        pinned: false,
        url: url
      })
      return Promise.resolve(createdTab)
    }
    if (tabs.length > 1) {
      console.log("found multiple tabs: ", tabs)
    }
    return Promise.resolve(tabs[0])
  }

  return {
    init,
    browserTabFor
  }

}


