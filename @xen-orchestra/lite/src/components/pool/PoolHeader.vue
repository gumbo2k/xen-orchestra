<template>
  <TitleBar :icon="faBuilding">
    {{ name }}
  </TitleBar>
</template>

<script lang="ts" setup>
import { useExtendedSubscription } from "@/composables/extended-subscription.composable";
import { usePoolStore } from "@/stores/pool.store";
import { uniquePoolExtension } from "@/stores/extensions/pool/unique-pool.extension";
import { computed } from "vue";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import TitleBar from "@/components/TitleBar.vue";

const { pool } = useExtendedSubscription(
  usePoolStore().subscribe(),
  uniquePoolExtension
);

const name = computed(() => pool.value?.name_label ?? "...");
</script>
