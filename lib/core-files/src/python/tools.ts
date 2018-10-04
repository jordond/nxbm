import { hasBinary } from "@nxbm/utils";

export async function checkPython2() {
  try {
    if (await hasBinary("python2")) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

export * from "./writer";
