<!-- TOC -->

- [Stores for XenApiRecord collections](#stores-for-xenapirecord-collections)
  - [Get the collection](#get-the-collection)
    - [Filter the collection](#filter-the-collection)
    - [Sort the collection](#sort-the-collection)
    - [Transform the collection](#transform-the-collection)
  - [Use the collection (subscribe)](#use-the-collection-subscribe)
  - [Deferred subscription](#deferred-subscription)
  - [Create a dedicated store for a collection](#create-a-dedicated-store-for-a-collection)
  - [Use the subscription](#use-the-subscription)
  - [Extending the base Subscription](#extending-the-base-subscription)
  <!-- TOC -->

# Stores for XenApiRecord collections

All collections of `XenApiRecord` are stored inside the `xapiCollectionStore`.

## Get the collection

To retrieve a collection, invoke `useXapiCollectionStore().get(type)`.

## Alter the collection

You can alter the records by passing a function to the `filter`, `sort` or `transform` options.

They will be applied in this order (`filter` -> `sort` -> `transform`).

### Filter the collection

You can filter the records of the collection by passing a `filter` option.

```typescript
useXapiCollectionStore().get("VM", {
  filter: (vm: XenApiVm) =>
    !vm.is_a_snapshot && !vm.is_a_template && !vm.is_control_domain,
});
```

### Sort the collection

You can sort the records of the collection by passing a `sort` option.

```typescript
useXapiCollectionStore().get("VM", {
  sort: (vm1: XenApiVm, vm2: XenApiVm) =>
    vm1.name_label.localeCompare(vm2.name_label),
});
```

### Transform the collection

You can transform the records of the collection by passing a `transform` option.

```typescript
// Transform a XenApiMessage to XenApiAlarm
useXapiCollectionStore().get("message", {
  transform: (message: XenApiMessage) =>
    ({
      ...message,
      someProp: "Some value",
    }) as XenApiAlarm,
});
```

## Use the collection (subscribe)

In order to use a collection, you'll need to subscribe to it.

```typescript
const consoleStore = useXapiCollectionStore().get("console");
const { records, getByUuid /* ... */ } = consoleStore.subscribe();
```

## Deferred subscription

If you don't want to fetch the data of the collection when subscribing the page, you can pass `{ immediate: false }` as
options to `subscribe()`.

You'll then need to call `start()` to initialize the subscription.

```typescript
const consoleStore = useXapiCollectionStore().get("console");
const { records, start, isStarted /* ... */ } = consoleStore.subscribe({
  immediate: false,
});

const handleClick = () => start();
```

## Create a dedicated store for a collection

To create a dedicated store for a specific `XenApiRecord`, simply return the collection from the XAPI Collection Store:

```typescript
export const useConsoleStore = defineStore("console", () =>
  useXapiCollectionStore().get("console")
);
```

## Use the subscription

```typescript
const store = useConsoleStore();

const { records, getByUuid /* ... */ } = store.subscribe();
```

## Extending the base Subscription

You may need to add some computed properties to the subscription.

To do so, you can use the `useExtendedSubscription(originalSubscription, ...extensions)` helper.

`useExtendedSubscription` takes the original subscription and a list of extensions.

An extension is a function that takes the original subscription and returns an object containing the new properties to
be added.

```typescript
const consoleStore = useConsoleStore();
const { records, newProp, otherProp1, otherProp2 } = useExtendedSubscription(
  consoleStore.subscribe(),
  (subscription) => ({
    newProp: computed(() => {
      /* ... */
    }),
  }),
  ({ records }) => ({
    otherProp1: computed(() => {
      /* ... */
    }),
    otherProp2: computed(() => {
      /* ... */
    }),
  })
);
```

It is recommended to store the extension in a dedicated file in `store/extensions/**/*.extension.ts`).

```typescript
// store/extensions/console.extension.ts
export const newPropExtension = (subscription: ConsoleSubscription) => ({
  newProp: computed(() => {
    /* ... */
  }),
});

// store/console.store.ts
const consoleStore = useConsoleStore();
const { records, newProp } = useExtendedSubscription(
  consoleStore.subscribe(),
  newPropExtension
);
```
