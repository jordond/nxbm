import { createLogger, getConfig } from "@nxbm/core";
import { format } from "@nxbm/utils";
import { exec as fsExec } from "child_process";
import { ensureDir, pathExists } from "fs-extra";
import { resolve } from "path";
import { promisify } from "util";

import { hactoolBinary } from "./tools";

const exec = promisify(fsExec);

export enum Command {
  UNPACK_SECTION0 = "section0",
  UNPACK_ROMFS = "romfs",
  INFO = ""
}

export interface HactoolOptions {
  path: string;
  keys: string;
  cwd?: string;
}

export async function runHactool(
  command: string,
  { path, keys, cwd }: HactoolOptions
) {
  const log = createLogger("hactool:command");
  log.silly(`Options:\n${format({ command, ...{ path, keys, cwd } })}`);

  const resolvedPath = resolve(path);
  const resolvedKeys = resolve(keys);

  if (!(await pathExists(resolvedPath))) {
    throw new Error(`Hactool was not found at ${resolvedPath}`);
  }

  if (!(await pathExists(resolvedKeys))) {
    throw new Error(`Keys file was not found at ${resolvedKeys}`);
  }

  const execOpts = cwd ? { cwd } : {};
  const fullCommand = `${resolvedPath} -k ${resolvedKeys} ${command}`;

  try {
    log.silly(`Executing:\n${fullCommand}`);
    const { stdout, stderr } = await exec(fullCommand, {
      windowsHide: true,
      ...execOpts
    });

    log.silly(`stdout: ${stdout}`);
    if (stderr) {
      throw new Error(stderr);
    }

    return stdout;
  } catch (error) {
    log.error("Failed to run hactool command");
    log.error(fullCommand);
    log.error(error);
    return "";
  }
}

export function createHactool(opts: HactoolOptions) {
  return {
    opts,
    run: (command: string) => runHactool(command, opts)
  };
}

export function unpackSection0(input: string, outputDir: string) {
  return doCommand(Command.UNPACK_SECTION0, input, outputDir);
}

export function unpackRomFs(input: string, outputDir: string) {
  return doCommand(Command.UNPACK_ROMFS, input, outputDir);
}

export function getInfo(input: string) {
  return doCommand(Command.INFO, input, "");
}

async function doCommand(cmd: Command, input: string, outputDir: string) {
  const log = createLogger(`hactool:${cmd}`);

  const resolvedIn = resolve(input);
  const resolvedOut = resolve(outputDir);

  await ensureDir(resolvedOut);

  log.silly(`Command ${cmd} -> ${resolvedIn}`);
  log.silly(`to -> ${resolvedOut}`);

  const command = `${
    cmd === Command.INFO ? "" : `--${cmd}dir=${resolvedOut}`
  } ${resolvedIn}`;

  const result = await createHactool({
    path: hactoolBinary(),
    keys: getConfig().paths!.keys
  }).run(command);

  log.silly(`${cmd} result -> ${result}`);

  return result;
}
