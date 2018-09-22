import { resolve } from "path";
import { PythonShell } from "python-shell";

export interface DecryptOptions {
  key: string;
  inputPath: string;
  output: string;
}

export function decrypt({
  key,
  inputPath,
  output
}: DecryptOptions): Promise<string[]> {
  return new Promise((res, reject) => {
    const args = ["--key", key, "--file", resolve(inputPath), "--out", output];
    PythonShell.run(
      "decryptxts.py",
      { args, scriptPath: __dirname, pythonPath: "python2" },
      (err, results: string[] | undefined) =>
        err ? reject(err) : res(results || [])
    );
  });
}
