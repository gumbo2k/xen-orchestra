<template>
  <UiCard>
    <UiCardTitle :count="pendingTasks.length">{{ $t("tasks") }}</UiCardTitle>
    <TasksTable :pending-tasks="pendingTasks" />
  </UiCard>
</template>

<script lang="ts" setup>
import TasksTable from "@/components/tasks/TasksTable.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiCardTitle from "@/components/ui/UiCardTitle.vue";
import { useExtendedSubscription } from "@/composables/extended-subscription.composable";
import { taskByStatusExtension } from "@/stores/extensions/task/by-status.extension";
import { useTaskStore } from "@/stores/task.store";

const { pendingTasks } = useExtendedSubscription(
  useTaskStore().subscribe(),
  taskByStatusExtension
);
</script>

<style lang="postcss" scoped></style>
