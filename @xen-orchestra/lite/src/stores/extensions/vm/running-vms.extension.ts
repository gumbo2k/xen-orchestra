import type { XenApiVm } from "@/libs/xen-api";
import { POWER_STATE } from "@/libs/xen-api";
import type { Subscription } from "@/types/xapi-collection";
import { computed } from "vue";

export const runningVmsExtension = (
  vmSubscription: Subscription<XenApiVm>
) => ({
  runningVms: computed(() =>
    vmSubscription.records.value.filter(
      (vm) => vm.power_state === POWER_STATE.RUNNING
    )
  ),
});
