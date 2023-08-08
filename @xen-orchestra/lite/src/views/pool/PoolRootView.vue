<template>
  <div class="pool-root-view">
    <PoolHeader />
    <PoolTabBar />

    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import PoolHeader from "@/components/pool/PoolHeader.vue";
import PoolTabBar from "@/components/pool/PoolTabBar.vue";
import { useExtendedSubscription } from "@/composables/extended-subscription.composable";
import { usePageTitleStore } from "@/stores/page-title.store";
import { usePoolStore } from "@/stores/pool.store";
import { uniquePoolExtension } from "@/stores/extensions/pool/unique-pool.extension";

const { pool } = useExtendedSubscription(
  usePoolStore().subscribe(),
  uniquePoolExtension
);

usePageTitleStore().setObject(pool);
</script>

<style lang="postcss" scoped></style>
