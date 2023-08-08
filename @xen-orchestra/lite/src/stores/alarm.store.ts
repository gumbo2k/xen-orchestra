import { parseAlarmBody } from "@/libs/alarm";
import type { XenApiAlarm } from "@/libs/xen-api";
import { useXapiCollectionStore } from "@/stores/xapi-collection.store";
import { defineStore } from "pinia";

export const useAlarmStore = defineStore("alarm", () =>
  useXapiCollectionStore().get("message", {
    filter: (message) => message.name === "ALARM",
    transform: (message) =>
      ({
        ...message,
        ...parseAlarmBody(message.body),
      }) as XenApiAlarm,
  })
);
