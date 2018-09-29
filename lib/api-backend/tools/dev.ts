import { createServer, startServer } from "@nxbm/api-server";
import { getConfig } from "@nxbm/core";

import { initBackend } from "../src/index";

initBackend(getConfig())
  .then(async _ => {
    const server = await createServer(getConfig());
    await startServer(server);
  })
  .catch(err => console.error("Something bad happened", err));
