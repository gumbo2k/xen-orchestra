import type { XenApiHost, XenApiVm } from "@/libs/xen-api";
import type { Subscription } from "@/types/xapi-collection";
import { computed } from "vue";

export const byHostRefExtension = (vmSubscription: Subscription<XenApiVm>) => ({
  recordsByHostRef: computed(() => {
    const vmsByHostOpaqueRef = new Map<XenApiHost["$ref"], XenApiVm[]>();

    vmSubscription.records.value.forEach((vm) => {
      if (!vmsByHostOpaqueRef.has(vm.resident_on)) {
        vmsByHostOpaqueRef.set(vm.resident_on, []);
      }

      vmsByHostOpaqueRef.get(vm.resident_on)?.push(vm);
    });

    return vmsByHostOpaqueRef;
  }),
});
