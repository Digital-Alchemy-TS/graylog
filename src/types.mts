import { TConfigLogLevel } from "@digital-alchemy/core";

export const GRAYLOG_LOG_LEVEL = {
  /**
   * action must be taken immediately
   */
  ALERT: 1,
  /**
   * critical conditions
   */
  CRIT: 2,
  /**
   * debug level message
   */
  DEBUG: 7,
  /**
   * system is unusable
   */
  EMERG: 0,
  /**
   * because people WILL typo
   */
  ERROR: 3,
  /**
   * informational message
   */
  INFO: 6,
  /**
   * normal, but significant, condition
   */
  NOTICE: 5,
  /**
   * warning conditions
   */
  WARNING: 4,
} as const;

export const GraylogLevelMapping = new Map<TConfigLogLevel, number>([
  ["trace", GRAYLOG_LOG_LEVEL.NOTICE],
  ["debug", GRAYLOG_LOG_LEVEL.DEBUG],
  ["info", GRAYLOG_LOG_LEVEL.INFO],
  ["warn", GRAYLOG_LOG_LEVEL.WARNING],
  ["error", GRAYLOG_LOG_LEVEL.ERROR],
  ["fatal", GRAYLOG_LOG_LEVEL.CRIT],
]);
