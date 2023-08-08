import type { XenApiAlarmType } from "@/libs/xen-api";

const parseXml = (xml: string) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xml, "text/xml");

  if (dom.querySelector("parsererror") !== null) {
    return;
  }

  const variable = dom.querySelector("variable");

  const type = variable
    ?.querySelector("name")
    ?.getAttribute("value") as XenApiAlarmType;

  const triggerLevel = variable
    ?.querySelector("alarm_trigger_level")
    ?.getAttribute("value");

  return {
    type,
    triggerLevel,
  };
};

// body is a string in the following form:
// ```
// value: 0.960224
// config:
// <variable>
//     <name value="mem_usage"/>
//     <alarm_trigger_level value="0.95"/>
//     <... />
// </variable>
// ```
export const parseAlarmBody = (body: string) => {
  const lines = body.split("\n");
  const level = parseFloat(lines[0].split(":")[1].trim());

  if (isNaN(level)) {
    return;
  }

  const document = parseXml(lines.slice(2).join("\n"));

  if (document?.type == null || document?.triggerLevel == null) {
    return;
  }

  return {
    level,
    type: document.type,
    triggerLevel: parseFloat(document.triggerLevel),
  };
};
