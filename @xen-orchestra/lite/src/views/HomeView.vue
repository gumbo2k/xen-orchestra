<template>Chargement en cours...</template>

<script lang="ts" setup>
import { useExtendedSubscription } from "@/composables/extended-subscription.composable";
import { usePoolStore } from "@/stores/pool.store";
import { uniquePoolExtension } from "@/stores/extensions/pool/unique-pool.extension";
import { whenever } from "@vueuse/core";
import { useRouter } from "vue-router";

const router = useRouter();

const { pool } = useExtendedSubscription(
  usePoolStore().subscribe(),
  uniquePoolExtension
);

whenever(
  () => pool.value?.uuid,
  (poolUuid) =>
    router.push({
      name: "pool.dashboard",
      params: { uuid: poolUuid },
    }),
  { immediate: true }
);
</script>
