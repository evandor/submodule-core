import {formatDistance} from "date-fns";
import sanitizeHtml from "sanitize-html";
import _ from "lodash";

export function useUtils() {

  const formatDate = (timestamp: number | undefined) =>
    timestamp ? formatDistance(timestamp, new Date(), {addSuffix: true}) : ""

  const createDataTestIdentifier = (prefix: string, url: string) =>
    prefix + "_" + url.replace("https://", "").replaceAll('.', '').replaceAll("/", "")

  const inBexMode = () => process.env.MODE === 'bex'
  const modeIs = (ident: string) => process.env.MODE === ident

  const normalize = (url: string): string => {
    try {
      new URL(url)
      return url
    } catch (err) {
      return "https://" + url
    }
  }

  const sanitize = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: sanitizeHtml.defaults.allowedAttributes = {
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading']
      },
      allowedSchemesByTag: {
        img: ['data']
      }
    })
  }

  const sanitizeAsText = (input: string): string => {
    return sanitizeHtml(input, {
      allowedTags: sanitizeHtml.defaults.allowedTags,//.concat(['img']),
      allowedAttributes: sanitizeHtml.defaults.allowedAttributes = {
        a: ['href', 'name', 'target']
      }
    })
  }

  const sanitizeAsHtml = (input: string): string => {
    return sanitizeHtml(input,{
      allowedTags: false, //sanitizeHtml.defaults.allowedTags.concat([ 'base','img', 'style','script' ]),
      allowedAttributes: false
    })
  }

  const sendMsg = (msgName: string, data: object = {}) => {
    if (inBexMode() && chrome) {
      console.debug(" >>> sending message", {name: msgName, data})
      chrome.runtime.sendMessage({
        name: msgName, data: data
      }, (callback: any) => {
        if (callback) {
          console.log("got callback", callback)
        }
        if (chrome.runtime.lastError) { /* ignore */
          console.debug("Logging error after sendMsg", msgName, chrome.runtime.lastError)
        }
      });
    }
  }

  function urlToHost(url: string): string {
    try {
      const theURL = new URL(url)
      return theURL.host
    } catch (err) {
      return null as unknown as string
    }
  }

  const calcHostList = (tabs: chrome.tabs.Tab[]): string[] => {
    const stringArray = Array.from(new Set(_.map(tabs, (bwTabs:chrome.tabs.Tab) => urlToHost(bwTabs.url || ''))))
    return _.filter(stringArray, (e: string | undefined) => e !== null)
  }

  const favIconFromUrl = (url: string): string => {
    let theRealUrl
    try {
      theRealUrl = new URL(url)
    } catch (err) {
      if (!url.startsWith('http')) {
        url = 'https://' + url
        try {
          theRealUrl = new URL(url)
        } catch (err) {
        }
      }
    }
    return theRealUrl ? "https://icons.duckduckgo.com/ip3/" + theRealUrl.hostname + ".ico" : ''
  }

  // from https://www.npmjs.com/package/serialize-selection?activeTab=code
  const restoreSelection = (state:any, referenceNode:any = undefined) => {
    referenceNode = referenceNode || document.body

    let i
      , node
      , nextNodeCharIndex
      , currentNodeCharIndex = 0
      , nodes = [referenceNode]
      , sel = window.getSelection()
      , range = document.createRange()

    range.setStart(referenceNode, 0)
    range.collapse(true)

    while (node = nodes.pop()) {
      if (node.nodeType === 3) { // TEXT_NODE
        nextNodeCharIndex = currentNodeCharIndex + node.length

        // if this node contains the character at the start index, set this as the
        // starting node with the correct offset
        if (state.start >= currentNodeCharIndex && state.start <= nextNodeCharIndex) {
          range.setStart(node, state.start - currentNodeCharIndex)
        }

        // if this node contains the character at the end index, set this as the
        // ending node with the correct offset and stop looking
        if (state.end >= currentNodeCharIndex && state.end <= nextNodeCharIndex) {
          range.setEnd(node, state.end - currentNodeCharIndex)
          break
        }

        currentNodeCharIndex = nextNodeCharIndex
      } else {

        // get child nodes if the current node is not a text node
        i = node.childNodes.length
        while (i--) {
          nodes.push(node.childNodes[i])
        }
      }
    }

    sel!.removeAllRanges()
    sel!.addRange(range)
    return sel
  }

  const serializeSelection = (referenceNode:any = undefined) => {
    referenceNode = referenceNode || document.body

    var sel = window.getSelection()
      , range = sel!.rangeCount
      ? sel!.getRangeAt(0).cloneRange()
      : document.createRange()
      , startContainer = range.startContainer
      , startOffset = range.startOffset
      , state:{[k: string]: any}  = { content: range.toString() }

    // move the range to select the contents up to the selection
    // so we can find its character offset from the reference node
    range.selectNodeContents(referenceNode)
    range.setEnd(startContainer, startOffset)

    state.start = range.toString().length
    state.end = state!.start + state.content.length

    // add a shortcut method to restore this selection
    state.restore = restoreSelection.bind(null, state, referenceNode)

    return state
  }

  return {
    formatDate,
    createDataTestIdentifier,
    inBexMode,
    normalize,
    modeIs,
    sanitize,
    sanitizeAsText,
    sanitizeAsHtml,
    sendMsg,
    calcHostList,
    favIconFromUrl,
    restoreSelection,
    serializeSelection
  }
}
