import type {
  GRANULARITY,
  VmStats,
  XapiStatsResponse,
} from "@/libs/xapi-stats";
import type { XenApiVm } from "@/libs/xen-api";
import { useHostStore } from "@/stores/host.store";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { Subscription } from "@/types/xapi-collection";

type GetStats = (
  id: XenApiVm["uuid"],
  granularity: GRANULARITY,
  ignoreExpired: boolean,
  opts: {
    abortSignal?: AbortSignal;
  }
) => Promise<XapiStatsResponse<VmStats> | undefined> | undefined;

export const getStatsExtension = (
  vmSubscription: Subscription<XenApiVm>
): {
  getStats: GetStats;
} => {
  const hostSubscription = useHostStore().subscribe();

  return {
    getStats: (id, granularity, ignoreExpired = false, { abortSignal }) => {
      const xenApiStore = useXenApiStore();

      if (!xenApiStore.isConnected) {
        return undefined;
      }

      const vm = vmSubscription.getByUuid(id);

      if (vm === undefined) {
        throw new Error(`VM ${id} could not be found.`);
      }

      const host = hostSubscription.getByOpaqueRef(vm.resident_on);

      if (host === undefined) {
        throw new Error(`VM ${id} is halted or host could not be found.`);
      }

      return xenApiStore.getXapiStats()._getAndUpdateStats<VmStats>({
        abortSignal,
        host,
        ignoreExpired,
        uuid: vm.uuid,
        granularity,
      });
    },
  };
};
