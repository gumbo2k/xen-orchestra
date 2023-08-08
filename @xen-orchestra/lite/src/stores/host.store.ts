import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useHostStore = defineStore("host", () =>
  useXapiCollectionStore().get("host")
);
