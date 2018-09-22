import { start } from "@nxbm/api-server";
import { createLogger } from "@nxbm/core";
import { tempDir } from "@nxbm/utils";
import { emptyDir } from "fs-extra";

import { bootstrap } from "./bootstrap";

async function fatalExit(error: any) {
  const log = createLogger();
  log.error("Due to the following error, the app is exiting.");
  log.error(error, () =>
    setTimeout(async () => {
      await emptyDir(tempDir());
      process.exit(1);
    }, 2000)
  );
}

export async function init() {
  try {
    const config = await bootstrap(fatalExit);
    await start(config);
  } catch (error) {
    fatalExit(error);
  }
}
