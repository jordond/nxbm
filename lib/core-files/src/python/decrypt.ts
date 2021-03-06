import { resolve } from "path";
import { PythonShell } from "python-shell";

import { writeScriptsIfNotExists } from "./writer";
import script from "./xtsdecrypt";

export interface DecryptOptions {
  key: string;
  inputPath: string;
  output: string;
}

export async function decrypt({
  key,
  inputPath,
  output
}: DecryptOptions): Promise<string[]> {
  if (!(await writeScriptsIfNotExists())) {
    throw new Error("Unable to decrypt because the python files don't exist!");
  }

  return new Promise((res, reject) => {
    const args = ["--key", key, "--file", resolve(inputPath), "--out", output];
    PythonShell.run(
      `${script.name}.py`,
      { args, scriptPath: __dirname, pythonPath: "python2" },
      (err, results: string[] | undefined) =>
        err ? reject(err) : res(results || [])
    );
  }) as Promise<string[]>;
}
