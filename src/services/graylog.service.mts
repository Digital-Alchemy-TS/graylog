/* eslint-disable @typescript-eslint/no-magic-numbers */
import {
  BootstrapException,
  eachSeries,
  is,
  SECOND,
  TConfigLogLevel,
  TServiceParams,
} from "@digital-alchemy/core";
import { randomBytes } from "crypto";
import { createSocket } from "dgram";
import { deflate } from "zlib";

import { GRAYLOG_LOG_LEVEL, GraylogLevelMapping } from "../types.mts";

const BOOT_ERROR = "graylog host required as part of bootstrap configuration";
const HEADER_SIZE = 12;
const RANDOM_BYTE_SIZE = 8;
const MAX_CHUNKS = 128;
const OFFSET = 0;
const SUPER_LATE = -1000;
type BufferArray = Buffer[];

const formatKeys = (data: object) =>
  // _id is internal use, there isn't a good alternative here
  Object.fromEntries(Object.keys(data).map(key => [key === "id" ? "__id" : `_${key}`, data[key]]));

/**
 * - All chunks MUST arrive within 5 seconds or the server will discard all chunks that have arrived or are in the process of arriving.
 * - A message MUST NOT consist of more than 128 chunks.
 */
export function GraylogService({ internal, context, config, logger, lifecycle }: TServiceParams) {
  // #MARK: init
  let client = createSocket("udp4");
  let open = true;
  const inProgress = new Set<Promise<void>>();

  // log as late as possible
  lifecycle.onShutdownComplete(async () => {
    open = false;
    await Promise.allSettled(inProgress.values());
    client.close();
    client.removeAllListeners();
    client = undefined;
  }, SUPER_LATE);

  const hasInitialHost = !is.empty(config.graylog.GRAYLOG_HOST);
  if (!hasInitialHost) {
    logger.fatal(BOOT_ERROR);
    throw new BootstrapException(context, "MISSING_GRAYLOG_HOST", BOOT_ERROR);
  }
  const { BUFFER_SIZE: bufferSize, GRAYLOG_HOST, HOST, GRAYLOG_PORT, MERGE_DATA } = config.graylog;

  const formattedMerge = formatKeys(MERGE_DATA);

  // #MARK: buildChunks
  async function gelfChunk(buffer: Buffer): Promise<BufferArray> {
    if (buffer.length <= bufferSize) {
      return [buffer];
    }

    const size = bufferSize - HEADER_SIZE;
    const length = Math.ceil(buffer.length / size);

    if (length > MAX_CHUNKS) {
      this.emitError(new Error(`Payload too large. Maximum size is ${size * MAX_CHUNKS} bytes.`));
      return [];
    }

    return await new Promise<BufferArray>(done => {
      randomBytes(RANDOM_BYTE_SIZE, async (error, id) => {
        if (error) {
          done([]);
          return;
        }

        done(
          Array.from({ length }).map((_, idx) => {
            const chunk = Buffer.alloc(bufferSize);

            // https://go2docs.graylog.org/current/getting_in_log_data/gelf.html
            // - Chunked GELF magic bytes - 2 bytes
            chunk[0] = 0x1e;
            chunk[1] = 0x0f;

            // - Message ID - 8 bytes
            // Must be the same for every chunk of this message
            // Identifies the whole message and is used to reassemble the chunks later.
            // Generate from millisecond timestamp + hostname, for example.
            id.copy(chunk, 2);

            // - Sequence number - 1 byte
            // The sequence number of this chunk starts at 0 and is always less than the sequence count.
            chunk[10] = idx;

            // - Sequence count - 1 byte
            // Total number of chunks this message has.
            chunk[11] = length;

            // - Data portion
            const start = idx * size;
            const end = Math.min((idx + 1) * size, buffer.length);
            buffer.copy(chunk, 12, start, end);
            return chunk.subarray(0, 12 + (end - start));
          }),
        );
      });
    });
  }

  // #MARK: addTarget
  if (config.graylog.HOOK_LOGGER) {
    internal.boilerplate.logger.addTarget((short_message, data) => {
      if (!open) {
        return;
      }
      let level: TConfigLogLevel = "info";
      if ("level" in data && is.string(data.level)) {
        level = data.level as TConfigLogLevel;
        delete data.level;
      }
      send(GraylogLevelMapping.get(level) ?? GRAYLOG_LOG_LEVEL.INFO, short_message, data);
    });
  }

  // #MARK: send
  function send(level: number, short_message: string, data: object) {
    if (!open) {
      return;
    }
    const payload = Buffer.from(
      JSON.stringify({
        ...formatKeys(data),
        ...formattedMerge,
        _log_level: level,
        host: HOST,
        level,
        short_message,
        timestamp: Date.now() / SECOND,
        // gelf spec version
        version: "1.1",
      }),
    );
    deflate(payload, async (_, buffer) => {
      const send = new Promise<void>(async done => {
        const chunks = await gelfChunk(buffer);
        await eachSeries(
          chunks,
          async chunk =>
            new Promise<void>(done =>
              client.send(chunk, OFFSET, chunk.length, GRAYLOG_PORT, GRAYLOG_HOST, () => done()),
            ),
        );
        done();
      });
      inProgress.add(send);
      await send;
      inProgress.delete(send);
    });
  }

  return { send };
}
