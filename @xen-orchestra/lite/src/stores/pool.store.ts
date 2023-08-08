import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const usePoolStore = defineStore("pool", () =>
  useXapiCollectionStore().get("pool")
);
