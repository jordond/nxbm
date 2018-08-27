import { emptyDir } from "fs-extra";
import bootstrap from "./bootstrap";
import { create } from "./logger";
import { start } from "./server";
import { tempDir } from "./util/filesystem";

bootstrap()
  .then(config => start(config))
  .catch(async error => {
    await emptyDir(tempDir());

    const log = create();
    log.error("Due to the following error, the app is exiting.");
    log.error(error, () => setTimeout(() => process.exit(1), 2000));
  });
