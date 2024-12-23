import { defineStore } from 'pinia'
import { ref } from 'vue'
import { TabsetInfo } from 'src/core/models/TabsetInfo'
import { SpaceInfo } from 'src/core/models/SpaceInfo'

/**
 * a pinia store for a quick-access-registry of available entities (type, name and id).
 *
 * Idea: Break dependencies between modules
 */

export const useEntityRegistryStore = defineStore('entityRegistry', () => {
  /**
   */
  const tabsetRegistry = ref<TabsetInfo[]>([])
  const spacesRegistry = ref<SpaceInfo[]>([])

  return {
    tabsetRegistry,
    spacesRegistry,
  }
})
