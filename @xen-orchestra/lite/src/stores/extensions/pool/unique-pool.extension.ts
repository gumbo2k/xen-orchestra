import { getFirst } from "@/libs/utils";
import type { XenApiPool } from "@/libs/xen-api";
import type { Subscription } from "@/types/xapi-collection";
import { computed } from "vue";

export const uniquePoolExtension = (
  poolSubscription: Subscription<XenApiPool>
) => ({
  pool: computed(() => getFirst(poolSubscription.records.value)),
});
