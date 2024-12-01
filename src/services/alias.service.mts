import { TServiceParams } from "@digital-alchemy/core";

import { GRAYLOG_LOG_LEVEL } from "../types.mts";

export function GraylogAlert({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.ALERT, short_message, data);
  };
}

export function GraylogCrit({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.CRIT, short_message, data);
  };
}

export function GraylogDebug({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.DEBUG, short_message, data);
  };
}

export function GraylogEmerg({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.EMERG, short_message, data);
  };
}

export function GraylogError({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.ERROR, short_message, data);
  };
}

export function GraylogInfo({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.INFO, short_message, data);
  };
}

export function GraylogNotice({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.NOTICE, short_message, data);
  };
}

export function GraylogWarning({ graylog }: TServiceParams) {
  return function (short_message: string, data: object): void {
    graylog.internal.send(GRAYLOG_LOG_LEVEL.WARNING, short_message, data);
  };
}
