import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useAlarmStore = defineStore("alarm", () =>
  useXapiCollectionStore().get("message", {
    filter: (record) => record.name === "alarm",
  })
);
