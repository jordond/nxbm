import { emptyDir } from "fs-extra";

import bootstrap from "./bootstrap";
import { create } from "./logger";
import { start } from "./server";
import { tempDir } from "./util/filesystem";

async function fatalExit(error: any) {
  const log = create();
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
