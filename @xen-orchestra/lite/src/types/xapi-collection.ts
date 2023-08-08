import type { XenApiRecord } from "@/libs/xen-api";
import type {
  RawObjectType,
  XenApiConsole,
  XenApiHost,
  XenApiHostMetrics,
  XenApiMessage,
  XenApiPool,
  XenApiSr,
  XenApiTask,
  XenApiVm,
  XenApiVmGuestMetrics,
  XenApiVmMetrics,
} from "@/libs/xen-api";
import type { ComputedRef, Ref } from "vue";

export type CollectionGetterOptions<
  InputType extends XenApiRecord<any>,
  OutputType extends XenApiRecord<any>,
> = {
  filter?: (record: InputType) => boolean;
  sort?: (a: InputType, b: InputType) => number;
  transform?: (record: InputType) => OutputType;
};

export type SubscribeOptions<Immediate extends boolean> = {
  immediate?: Immediate;
};

export type ImmediateSubscription<T extends XenApiRecord<any>> = {
  records: Readonly<Ref<T[]>>;
  getByOpaqueRef: (opaqueRef: T["$ref"]) => T | undefined;
  getByUuid: (uuid: T["uuid"]) => T | undefined;
  hasUuid: (uuid: T["uuid"]) => boolean;
  isReady: Readonly<Ref<boolean>>;
  isFetching: Readonly<Ref<boolean>>;
  isReloading: ComputedRef<boolean>;
  hasError: ComputedRef<boolean>;
  lastError: Readonly<Ref<string | undefined>>;
};

export type DeferredSubscription<T extends XenApiRecord<any>> =
  ImmediateSubscription<T> & {
    start: () => void;
    isStarted: ComputedRef<boolean>;
  };

export type Subscription<
  T extends XenApiRecord<any>,
  O extends SubscribeOptions<boolean> = any,
> = O extends SubscribeOptions<infer Immediate>
  ? Immediate extends false
    ? DeferredSubscription<T>
    : ImmediateSubscription<T>
  : never;

interface ISubscribe<T extends XenApiRecord<any>> {
  (options?: SubscribeOptions<true>): ImmediateSubscription<T>;
  (options: SubscribeOptions<false>): DeferredSubscription<T>;
  <O extends SubscribeOptions<boolean>>(options?: O): Subscription<T, O>;
}

export interface XenApiCollection<T extends XenApiRecord<any>> {
  subscribe: ISubscribe<T>;
  hasSubscriptions: ComputedRef<boolean>;
  add: (record: T) => void;
  update: (record: T) => void;
  remove: (opaqueRef: T["$ref"]) => void;
}

type ExtractExtensions<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends SubscriptionExtension<any, infer X>
    ? X & ExtractExtensions<Rest>
    : ExtractExtensions<Rest>
  : object;

export type ExtendedSubscription<
  T extends Subscription<any>,
  X extends SubscriptionExtension<any, any>[],
> = T & ExtractExtensions<X>;

export type SubscriptionExtension<
  T extends Subscription<any>,
  X extends object,
> = (subscription: T) => X;

export type RawTypeToRecord<T extends RawObjectType> = T extends "SR"
  ? XenApiSr
  : T extends "VM"
  ? XenApiVm
  : T extends "VM_guest_metrics"
  ? XenApiVmGuestMetrics
  : T extends "VM_metrics"
  ? XenApiVmMetrics
  : T extends "console"
  ? XenApiConsole
  : T extends "host"
  ? XenApiHost
  : T extends "host_metrics"
  ? XenApiHostMetrics
  : T extends "message"
  ? XenApiMessage
  : T extends "pool"
  ? XenApiPool
  : T extends "task"
  ? XenApiTask
  : never;
