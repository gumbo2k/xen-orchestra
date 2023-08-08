<template>
  <template v-if="record !== undefined">
    <RouterLink v-if="objectRoute" :to="objectRoute">
      {{ record.name_label }}
    </RouterLink>
    <span v-else>{{ record.name_label }}</span>
  </template>
  <span v-else class="unknown">{{ $t("unknown") }}</span>
</template>

<script
  generic="
    T extends RawObjectType,
    R extends RawTypeToRecord<T> = RawTypeToRecord<T>
  "
  lang="ts"
  setup
>
import type { RawObjectType } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import type { RawTypeToRecord } from "@/types/xapi-collection";
import { computed } from "vue";

const props = defineProps<{
  type: T;
  uuid: R["uuid"];
}>();

const store = computed(() => useXapiCollectionStore().get(props.type));

const getByUuid = computed(() => store.value.subscribe().getByUuid);

const record = computed(() => {
  const record = getByUuid.value(props.uuid);

  if (typeof record === "object" && "name_label" in record) {
    return record as R & { name_label: string };
  }

  return undefined;
});

const routes: Partial<Record<RawObjectType, string>> = {
  host: "host.dashboard",
  VM: "vm.console",
};

const objectRoute = computed(() => {
  if (routes[props.type] === undefined) {
    return;
  }

  return { name: routes[props.type], params: { uuid: props.uuid } };
});
</script>

<style lang="postcss" scoped>
.unknown {
  color: var(--color-blue-scale-300);
  font-style: italic;
}
</style>
