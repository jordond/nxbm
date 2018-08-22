import { exec as fsExec } from "child_process";
import { ensureDir, pathExists } from "fs-extra";
import { resolve } from "path";
import { promisify } from "util";

import { getConfig } from "../../config";
import { create } from "../../logger";
import { format } from "../../util/misc";
import { hactoolBinary } from "./tools";

const exec = promisify(fsExec);

export interface HactoolOptions {
  path: string;
  keys: string;
  cwd?: string;
}

export async function runHactool(
  command: string,
  { path, keys, cwd }: HactoolOptions
) {
  const log = create("hactool:command");
  log.debug(`Options:\n${format({ command, ...{ path, keys, cwd } })}`);

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
    log.debug(`Executing:\n${fullCommand}`);
    const { stdout, stderr } = await exec(fullCommand, {
      windowsHide: true,
      ...execOpts
    });

    log.silly(`stdout: ${stdout}`);
    if (stderr) {
      throw new Error(stderr);
    }

    return true;
  } catch (error) {
    log.error("Failed to run hactool command");
    log.error(fullCommand);
    log.error(error);
    return false;
  }
}

export function createHactool(opts: HactoolOptions) {
  return {
    opts,
    run: (command: string) => runHactool(command, opts)
  };
}

export function unpackSection0(input: string, outputDir: string) {
  return doCommand("section0", input, outputDir);
}

export function unpackRomFs(input: string, outputDir: string) {
  return doCommand("romfs", input, outputDir);
}

async function doCommand(name: string, input: string, outputDir: string) {
  const log = create(`hactool:${name}`);

  const resolvedIn = resolve(input);
  const resolvedOut = resolve(outputDir);

  await ensureDir(resolvedOut);

  log.verbose(`Unpacking ${name} -> ${resolvedIn}`);
  log.verbose(`to -> ${resolvedOut}`);

  const command = `--${name}dir=${resolvedOut} ${resolvedIn}`;
  const result = await createHactool({
    path: hactoolBinary(),
    keys: getConfig().paths!.keys
  }).run(command);

  log.verbose(`unpack ${name} result -> ${result}`);

  return result;
}
