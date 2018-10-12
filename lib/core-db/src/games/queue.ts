import * as Queue from "better-queue";

import { createLogger } from "@nxbm/core";
import { Game, IBackupConfig, MAX_CONCURRENCY } from "@nxbm/types";

import { addFile, markFileAsMissing } from "./manager";

interface Task {
  id: string;
  path: string;
}

let addFileQueue: Queue;
let missingFileQueue: Queue;

export function initQueue({ concurrent }: IBackupConfig) {
  const log = createLogger("queue:init");
  log.verbose(`Initializing Queue with a concurrency of ${concurrent}`);

  addFileQueue = createQueue(processAddFile, concurrent);
  missingFileQueue = createQueue(processUnlinkFile, concurrent);
}

export function queueAddFile(path: string) {
  return addToQueue(addFileQueue, path);
}

export function queueMarkMissingFile(path: string) {
  return addToQueue(missingFileQueue, path);
}

const processAddFile: Queue.ProcessFunction<string, Game> = async (
  task: Task,
  cb
) => {
  const log = createLogger("queue:addFile");
  log.debug(`Starting ${task.id}`);
  try {
    const result = await addFile(task.path);
    log.debug(
      `Finished ${task.id} -> ${result ? result.file.displayName() : "N/A"}`
    );
    cb(null, result);
  } catch (error) {
    cb(error, undefined);
  }
};

const processUnlinkFile: Queue.ProcessFunction<string, boolean> = async (
  task: Task,
  cb
) => {
  const log = createLogger("queue:unlink");
  log.debug(`Starting ${task.id}`);
  try {
    const result = await markFileAsMissing(task.path);
    log.debug(`Finished ${task.id} -> ${result}`);
    cb(null, result);
  } catch (error) {
    cb(error, false);
  }
};

function addToQueue(queue: Queue, path: string) {
  const task: Task = { path, id: path };
  return new Promise((resolve, reject) => {
    queue.push(task, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

function createQueue<T, K>(
  fn: Queue.ProcessFunction<T, K>,
  concurrent: number = 5
) {
  return new Queue(fn, {
    concurrent: concurrent > MAX_CONCURRENCY ? MAX_CONCURRENCY : concurrent,
    afterProcessDelay: 100,
    store: new (require("better-queue-memory"))()
  });
}
