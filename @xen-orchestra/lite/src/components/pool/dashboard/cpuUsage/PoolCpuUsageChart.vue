<template>
  <UiCard class="linear-chart" :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("pool-cpu-usage") }}</UiCardTitle>
    <UiCardTitle class="subtitle" :level="SUBTITLE_LEVEL">{{
      $t("last-week")
    }}</UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiSpinner v-else-if="isLoading" class="spinner" />
    <LinearChart
      v-else
      :data="data"
      :max-value="customMaxValue"
      :value-formatter="customValueFormatter"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import type { FetchedStats } from "@/composables/fetch-stats.composable";
import type { HostStats } from "@/libs/xapi-stats";
import { sumBy } from "lodash-es";
import LinearChart from "@/components/charts/LinearChart.vue";
import type { LinearChartData } from "@/types/chart";
import NoDataError from "@/components/NoDataError.vue";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useHostStore } from "@/stores/host.store";
import { useI18n } from "vue-i18n";
import UiSpinner from "@/components/ui/UiSpinner.vue";
import type { XenApiHost } from "@/libs/xen-api";

const SUBTITLE_LEVEL = 3;

const { t } = useI18n();

const hostLastWeekStats =
  inject<FetchedStats<XenApiHost, HostStats>>("hostLastWeekStats");

const { records: hosts, isFetching, hasError } = useHostStore().subscribe();

const customMaxValue = computed(
  () => 100 * sumBy(hosts.value, (host) => +host.cpu_info.cpu_count)
);

const data = computed<LinearChartData>(() => {
  const timestampStart = hostLastWeekStats?.timestampStart?.value;
  const stats = hostLastWeekStats?.stats?.value;

  if (timestampStart === undefined || stats == null) {
    return [];
  }

  const result = new Map<number, { timestamp: number; value: number }>();

  const addResult = (stats: HostStats) => {
    const cpus = Object.values(stats.cpus);

    for (let hourIndex = 0; hourIndex < cpus[0].length; hourIndex++) {
      const timestamp =
        (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000;

      const cpuUsageSum = cpus.reduce(
        (total, cpu) => total + cpu[hourIndex],
        0
      );

      result.set(timestamp, {
        timestamp: timestamp,
        value: Math.round((result.get(timestamp)?.value ?? 0) + cpuUsageSum),
      });
    }
  };

  stats.forEach((host) => {
    if (!host.stats) {
      return;
    }

    addResult(host.stats);
  });

  return [
    {
      label: t("stacked-cpu-usage"),
      data: Array.from(result.values()),
    },
  ];
});
const isStatFetched = computed(() => {
  const stats = hostLastWeekStats?.stats?.value;
  if (stats == null) {
    return false;
  }

  return stats.every((host) => {
    const hostStats = host.stats;
    return (
      hostStats != null &&
      Object.values(hostStats.cpus)[0].length === data.value[0].data.length
    );
  });
});

const isLoading = computed(() => isFetching.value || !isStatFetched.value);

const customValueFormatter = (value: number) => `${value}%`;
</script>

<style lang="postcss" scoped>
.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: auto;
  width: 40px;
  height: 40px;
}

.subtitle {
  --section-title-left-size: 1.5rem;
  --section-title-left-color: var(--color-blue-scale-300);
  --section-title-left-weight: 400;
}
</style>
