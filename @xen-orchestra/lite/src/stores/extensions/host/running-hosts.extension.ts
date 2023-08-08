import { isHostRunning } from "@/libs/utils";
import type { XenApiHost } from "@/libs/xen-api";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import type { Subscription } from "@/types/xapi-collection";
import { computed } from "vue";

export const runningHostsExtension = (
  hostsSubscription: Subscription<XenApiHost>
) => {
  const hostMetricsSubscription = useHostMetricsStore().subscribe();

  return {
    runningHosts: computed(() =>
      hostsSubscription.records.value.filter((host) =>
        isHostRunning(host, hostMetricsSubscription)
      )
    ),
  };
};
