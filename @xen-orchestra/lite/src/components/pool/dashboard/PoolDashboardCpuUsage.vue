<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle>
      {{ $t("cpu-usage") }}
      <template #right v-if="vmStatsCanBeExpired">Updating... </template>
    </UiCardTitle>
    <VmsCpuUsage />
  </UiCard>
</template>
<script lang="ts" setup>
import { computed, watchEffect, type ComputedRef } from "vue";
import HostsCpuUsage from "@/components/pool/dashboard/cpuUsage/HostsCpuUsage.vue";
import VmsCpuUsage from "@/components/pool/dashboard/cpuUsage/VmsCpuUsage.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useVmStore } from "@/stores/vm.store";
import { useHostStore } from "@/stores/host.store";
import { inject } from "vue";
import type { Stat } from "@/composables/fetch-stats.composable";
import type { HostStats, VmStats } from "@/libs/xapi-stats";

const vmStats = inject<ComputedRef<Stat<VmStats>[]>>(
  "vmStats",
  computed(() => [])
);

const vmStatsCanBeExpired = computed(() =>
  vmStats.value.some((stat) => stat.canBeExpired)
);

const hasError = computed(
  () => useVmStore().hasError || useHostStore().hasError
);
</script>
