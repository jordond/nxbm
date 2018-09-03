import { resolve } from "path";
import { run } from "python-shell";

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
    run(
      "decryptxts.py",
      { args, scriptPath: __dirname },
      (err, results: string[]) => (err ? reject(err) : res(results))
    );
  });
}
