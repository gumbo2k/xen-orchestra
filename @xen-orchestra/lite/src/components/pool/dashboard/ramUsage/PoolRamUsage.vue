<template>
  <UiCard class="linear-chart" :color="hasError ? 'error' : undefined">
    <UiCardTitle>{{ $t("pool-ram-usage") }}</UiCardTitle>
    <UiCardTitle :level="UI_CARD_TITLE_LEVEL.SUBTITLE">
      {{ $t("last-week") }}
    </UiCardTitle>
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="isLoading" />
    <LinearChart
      v-else
      :data="data"
      :max-value="customMaxValue"
      :value-formatter="customValueFormatter"
    />
    <SizeStatsSummary :size="currentData.size" :usage="currentData.usage" />
  </UiCard>
</template>

<script lang="ts" setup>
import LinearChart from "@/components/charts/LinearChart.vue";
import SizeStatsSummary from "@/components/ui/SizeStatsSummary.vue";
import type { FetchedStats } from "@/composables/fetch-stats.composable";
import { formatSize, getHostMemory } from "@/libs/utils";
import { UI_CARD_TITLE_LEVEL } from "@/components/enums";
import type { HostStats } from "@/libs/xapi-stats";
import NoDataError from "@/components/NoDataError.vue";
import { RRD_STEP_FROM_STRING } from "@/libs/xapi-stats";
import type { XenApiHost } from "@/libs/xen-api";
import { useHostMetricsStore } from "@/stores/host-metrics.store";
import { useHostStore } from "@/stores/host.store";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import UiCardSpinner from "@/components/ui/UiCardSpinner.vue";
import type { LinearChartData } from "@/types/chart";
import { sumBy } from "lodash-es";
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";

const hostMetricsSubscription = useHostMetricsStore().subscribe();

const hostStore = useHostStore();
const { runningHosts, isFetching, hasError } = hostStore.subscribe({
  hostMetricsSubscription,
});

const { t } = useI18n();

const hostLastWeekStats =
  inject<FetchedStats<XenApiHost, HostStats>>("hostLastWeekStats");

const customMaxValue = computed(() =>
  sumBy(
    runningHosts.value,
    (host) => getHostMemory(host, hostMetricsSubscription)?.size ?? 0
  )
);

const currentData = computed(() => {
  let size = 0,
    usage = 0;
  runningHosts.value.forEach((host) => {
    const hostMemory = getHostMemory(host, hostMetricsSubscription);
    size += hostMemory?.size ?? 0;
    usage += hostMemory?.usage ?? 0;
  });
  return { size, usage };
});

const data = computed<LinearChartData>(() => {
  const timestampStart = hostLastWeekStats?.timestampStart?.value;
  const stats = hostLastWeekStats?.stats?.value;

  if (timestampStart === undefined || stats == null) {
    return [];
  }

  const result = new Map<number, { timestamp: number; value: number }>();

  stats.forEach(({ stats }) => {
    if (stats?.memory === undefined) {
      return;
    }

    const memoryFree = stats.memoryFree;
    const memoryUsage = stats.memory.map(
      (memory, index) => memory - memoryFree[index]
    );

    memoryUsage.forEach((value, hourIndex) => {
      const timestamp =
        (timestampStart + hourIndex * RRD_STEP_FROM_STRING.hours) * 1000;

      result.set(timestamp, {
        timestamp,
        value: (result.get(timestamp)?.value ?? 0) + memoryUsage[hourIndex],
      });
    });
  });

  return [
    {
      label: t("stacked-ram-usage"),
      data: Array.from(result.values()),
    },
  ];
});

const isStatFetched = computed(() => {
  const stats = hostLastWeekStats?.stats?.value;
  if (stats === undefined) {
    return false;
  }

  return stats.every((host) => {
    const hostStats = host.stats;
    return (
      hostStats != null && hostStats.memory.length === data.value[0].data.length
    );
  });
});

const isLoading = computed(
  () => (isFetching.value && !hasError.value) || !isStatFetched.value
);

const customValueFormatter = (value: number) => String(formatSize(value));
</script>
