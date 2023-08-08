import type { RawObjectType, XenApiRecord } from "@/libs/xen-api";
import { useXenApiStore } from "@/stores/xen-api.store";
import type {
  CollectionGetterOptions,
  DeferredSubscription,
  ImmediateSubscription,
  RawTypeToRecord,
  SubscribeOptions,
  Subscription,
  XenApiCollection,
} from "@/types/xapi-collection";
import { whenever } from "@vueuse/core";
import { computed, readonly, ref, type ComputedRef } from "vue";

export const overrideSubscriptionRecords = <
  OutputType extends XenApiRecord<any>,
>(
  subscription: Subscription<any>,
  options?: CollectionGetterOptions<any, any>
): ComputedRef<OutputType[]> =>
  computed(() => {
    let records: OutputType[] = subscription.records.value;

    if (options?.filter !== undefined) {
      records = records.filter(options.filter);
    }

    if (options?.sort !== undefined) {
      records = records.sort(options.sort);
    }

    if (options?.transform !== undefined) {
      records = records.map(options.transform);
    }

    return records;
  });

export const createXapiCollection = <
  T extends RawObjectType,
  R extends RawTypeToRecord<T> = RawTypeToRecord<T>,
>(
  type: T
): XenApiCollection<R> => {
  const isReady = ref(false);
  const isFetching = ref(false);
  const isReloading = computed(() => isReady.value && isFetching.value);
  const lastError = ref<string>();
  const hasError = computed(() => lastError.value !== undefined);
  const subscriptions = ref(new Set<symbol>());
  const recordsByOpaqueRef = ref(new Map<R["$ref"], R>());
  const recordsByUuid = ref(new Map<R["uuid"], R>());
  const records = computed(() => Array.from(recordsByOpaqueRef.value.values()));
  const xenApiStore = useXenApiStore();

  const getByOpaqueRef = (opaqueRef: R["$ref"]) =>
    recordsByOpaqueRef.value.get(opaqueRef);

  const getByUuid = (uuid: R["uuid"]) => recordsByUuid.value.get(uuid);

  const hasUuid = (uuid: R["uuid"]) => recordsByUuid.value.has(uuid);

  const hasSubscriptions = computed(() => subscriptions.value.size > 0);

  const fetchAll = async () => {
    try {
      isFetching.value = true;
      lastError.value = undefined;
      const records = await xenApiStore.getXapi().loadRecords<T, R>(type);
      recordsByOpaqueRef.value.clear();
      recordsByUuid.value.clear();
      records.forEach(add);
      isReady.value = true;
    } catch (e) {
      lastError.value = `[${type}] Failed to fetch records`;
    } finally {
      isFetching.value = false;
    }
  };

  const add = (record: R) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const update = (record: R) => {
    recordsByOpaqueRef.value.set(record.$ref, record);
    recordsByUuid.value.set(record.uuid, record);
  };

  const remove = (opaqueRef: R["$ref"]) => {
    if (!recordsByOpaqueRef.value.has(opaqueRef)) {
      return;
    }

    const record = recordsByOpaqueRef.value.get(opaqueRef)!;
    recordsByOpaqueRef.value.delete(opaqueRef);
    recordsByUuid.value.delete(record.uuid);
  };

  whenever(
    () => xenApiStore.isConnected && hasSubscriptions.value,
    () => fetchAll()
  );

  function subscribe<O extends SubscribeOptions<false>>(
    options: O
  ): DeferredSubscription<R>;

  function subscribe<O extends SubscribeOptions<true>>(
    options?: O
  ): ImmediateSubscription<R>;

  function subscribe<O extends SubscribeOptions<boolean>>(
    options?: O
  ): Subscription<R, O>;

  function subscribe<O extends SubscribeOptions<boolean>>(
    options?: O
  ): Subscription<R, O> {
    const subscription: ImmediateSubscription<R> = {
      records,
      getByOpaqueRef,
      getByUuid,
      hasUuid,
      isReady: readonly(isReady),
      isFetching: readonly(isFetching),
      isReloading: isReloading,
      hasError,
      lastError: readonly(lastError),
    };

    const id = Symbol();

    const start = () => subscriptions.value.add(id);

    if (options?.immediate !== false) {
      start();
      return subscription as Subscription<R, O>;
    }

    return {
      ...subscription,
      start,
      isStarted: computed(() => hasSubscriptions.value),
    } as unknown as Subscription<R, O>;
  }

  return {
    subscribe,
    hasSubscriptions,
    add,
    update,
    remove,
  };
};
