import * as hasbin from "hasbin";

export function hasBinary(binaryName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    (hasbin as any)(
      binaryName,
      (result: boolean) => (result ? resolve(true) : reject(false))
    );
  });
}
