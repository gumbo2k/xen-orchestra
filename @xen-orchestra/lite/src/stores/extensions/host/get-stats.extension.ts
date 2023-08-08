import type {
  GRANULARITY,
  HostStats,
  XapiStatsResponse,
} from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type { Subscription } from "@/types/xapi-collection";

type GetStats = (
  hostUuid: XenApiHost["uuid"],
  granularity: GRANULARITY,
  ignoreExpired: boolean,
  opts: {
    abortSignal?: AbortSignal;
  }
) => Promise<XapiStatsResponse<HostStats> | undefined> | undefined;

export const getStatsExtension = (
  hostSubscription: Subscription<XenApiHost>
): {
  getStats: GetStats;
} => {
  return {
    getStats: (
      hostUuid,
      granularity,
      ignoreExpired = false,
      { abortSignal }
    ) => {
      const xenApiStore = useXenApiStore();
      const host = hostSubscription.getByUuid(hostUuid);

      if (host === undefined) {
        throw new Error(`Host ${hostUuid} could not be found.`);
      }

      const xapiStats = xenApiStore.isConnected
        ? xenApiStore.getXapiStats()
        : undefined;

      return xapiStats?._getAndUpdateStats<HostStats>({
        abortSignal,
        host,
        ignoreExpired,
        uuid: host.uuid,
        granularity,
      });
    },
  };
};
