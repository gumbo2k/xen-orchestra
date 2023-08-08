import { sortRecordsByNameLabel } from "@/libs/utils";
import type { XenApiVm } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useVmStore = defineStore("vm", () =>
  useXapiCollectionStore().get("VM", {
    filter: (vm: XenApiVm) =>
      !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain,
    sort: sortRecordsByNameLabel,
  })
);
