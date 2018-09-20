import { createLogger } from "@nxbm/core";
import { tempDir } from "@nxbm/utils";
import { emptyDir } from "fs-extra";

import bootstrap from "./bootstrap";
import { start } from "./server";

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

bootstrap(fatalExit)
  .then(config => start(config))
  .catch(error => fatalExit(error));
