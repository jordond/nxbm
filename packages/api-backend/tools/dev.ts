import { getConfig } from "@nxbm/core";

import { initBackend } from "../src/index";

initBackend(getConfig())
  .then(server => server.start())
  .catch(err => console.error("Something bad happened", err));
