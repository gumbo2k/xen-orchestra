import { computed, unref } from "vue";
import { sortRecordsByNameLabel } from "@/libs/utils";
import type { GRANULARITY } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { createRecordContext } from "@/stores/index";
import { useXenApiStore } from "@/stores/xen-api.store";
import { defineStore } from "pinia";
import type { MaybeRef } from "@vueuse/core";

export const useHostStore = defineStore("host", () => {
  const xenApiStore = useXenApiStore();
  const xapiStats = computed(() =>
    xenApiStore.isConnected ? xenApiStore.getXapiStats() : undefined
  );
  const recordContext = createRecordContext<XenApiHost>("host", {
    sort: sortRecordsByNameLabel,
  });

  function getStats(
    id: string,
    granularity: GRANULARITY,
    ignoreExpired = false,
    { abortSignal }: { abortSignal?: AbortSignal } = {}
  ) {
    const host = recordContext.getRecordByUuid(id);
    if (host === undefined) {
      throw new Error(`Host ${id} could not be found.`);
    }
    return xapiStats.value?._getAndUpdateStats({
      abortSignal,
      host,
      uuid: host.uuid,
      granularity,
      ignoreExpired,
    });
  }

  return {
    ...recordContext,
    getStats,
  };
});
