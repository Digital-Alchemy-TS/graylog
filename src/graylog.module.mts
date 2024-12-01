import { CreateLibrary, InternalConfig } from "@digital-alchemy/core";
import { hostname } from "os";

import {
  GraylogAlert,
  GraylogCrit,
  GraylogDebug,
  GraylogEmerg,
  GraylogError,
  GraylogInfo,
  GraylogNotice,
  GraylogWarning,
} from "./services/alias.service.mts";
import { GraylogService } from "./services/graylog.service.mts";

export const LIB_GRAYLOG = CreateLibrary({
  configuration: {
    BUFFER_SIZE: {
      default: 1400,
      type: "number",
    },
    GRAYLOG_HOST: {
      description: "Identify self",
      required: true,
      type: "string",
    },
    GRAYLOG_PORT: {
      default: 12_201,
      type: "number",
    },
    HOOK_LOGGER: {
      default: false,
      type: "boolean",
    },
    HOST: {
      default: hostname(),
      type: "string",
    },
    MERGE_DATA: {
      default: {},
      description: [
        "Extra data to include in every message going to Graylog",
        "Similar to mergeData for the logger, but does not go to stdout",
      ],
      type: "internal",
    } as InternalConfig<Record<string, unknown>>,
  },
  name: "graylog",
  services: {
    alert: GraylogAlert,
    crit: GraylogCrit,
    debug: GraylogDebug,
    emerg: GraylogEmerg,
    error: GraylogError,
    info: GraylogInfo,
    internal: GraylogService,
    notice: GraylogNotice,
    warning: GraylogWarning,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    graylog: typeof LIB_GRAYLOG;
  }
}
