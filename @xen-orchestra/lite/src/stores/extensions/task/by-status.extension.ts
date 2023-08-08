import useArrayRemovedItemsHistory from "@/composables/array-removed-items-history.composable";
import useCollectionFilter from "@/composables/collection-filter.composable";
import useCollectionSorter from "@/composables/collection-sorter.composable";
import useFilteredCollection from "@/composables/filtered-collection.composable";
import useSortedCollection from "@/composables/sorted-collection.composable";
import type { XenApiTask } from "@/libs/xen-api";
import type { Subscription } from "@/types/xapi-collection";

export const taskByStatusExtension = (
  subscription: Subscription<XenApiTask>
) => {
  const { compareFn } = useCollectionSorter<XenApiTask>({
    initialSorts: ["-created"],
  });

  const { predicate } = useCollectionFilter({
    initialFilters: [
      "!name_label:|(SR.scan host.call_plugin)",
      "status:pending",
    ],
  });

  const sortedTasks = useSortedCollection(subscription.records, compareFn);

  return {
    pendingTasks: useFilteredCollection<XenApiTask>(sortedTasks, predicate),
    finishedTasks: useArrayRemovedItemsHistory(
      sortedTasks,
      (task) => task.uuid,
      {
        limit: 50,
        onRemove: (tasks) =>
          tasks.map((task) => ({
            ...task,
            finished: new Date().toISOString(),
          })),
      }
    ),
  };
};
