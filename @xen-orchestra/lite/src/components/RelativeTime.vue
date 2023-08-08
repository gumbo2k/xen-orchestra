<template>
  <span :title="date.toLocaleString()">{{ relativeTime }}</span>
</template>

<script lang="ts" setup>
import useRelativeTime from "@/composables/relative-time.composable";
import { parseDateTime } from "@/libs/utils";
import { useNow } from "@vueuse/core";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    date: number | string;
    interval?: number;
  }>(),
  { interval: 1000 }
);

const date = computed(() => new Date(parseDateTime(props.date)));
const now = computed(() => useNow({ interval: props.interval }).value);
const relativeTime = useRelativeTime(date, now);
</script>

<style lang="postcss" scoped></style>
