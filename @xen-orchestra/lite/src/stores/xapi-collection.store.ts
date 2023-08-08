import {
  createXapiCollection,
  overrideSubscriptionRecords,
} from "@/libs/xapi-collection";
import type { RawObjectType, XenApiRecord } from "@/libs/xen-api";
import type {
  CollectionGetterOptions,
  RawTypeToRecord,
  SubscribeOptions,
  Subscription,
  XenApiCollection,
} from "@/types/xapi-collection";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useXapiCollectionStore = defineStore("xapiCollection", () => {
  const collections = ref(new Map());

  function get<
    T extends RawObjectType,
    InputType extends RawTypeToRecord<T> = RawTypeToRecord<T>,
    OutputType extends XenApiRecord<any> = RawTypeToRecord<T>,
  >(
    type: T,
    options?: CollectionGetterOptions<InputType, OutputType>
  ): XenApiCollection<OutputType> {
    if (!collections.value.has(type)) {
      collections.value.set(type, createXapiCollection(type));
    }

    const collection = collections.value.get(
      type
    )! as XenApiCollection<InputType>;

    if (
      options?.filter === undefined &&
      options?.sort === undefined &&
      options?.transform === undefined
    ) {
      return collection as unknown as XenApiCollection<OutputType>;
    }

    const subscribe = <O extends SubscribeOptions<boolean>>(
      subscribeOptions?: O
    ): Subscription<OutputType, O> => {
      const subscription = collection.subscribe(subscribeOptions);

      const records = overrideSubscriptionRecords<OutputType>(
        subscription,
        options
      );

      return {
        ...subscription,
        records,
      } as unknown as Subscription<OutputType, O>;
    };

    return {
      ...collection,
      subscribe,
    } as unknown as XenApiCollection<OutputType>;
  }

  return { get };
});
