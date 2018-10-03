import { createLogger } from "@nxbm/core";
import { IFile } from "@nxbm/types";

import { getNSWDB } from "../nswdb";
import { getGameDB } from "./db";

export async function processDLC(file: IFile): Promise<IFile | undefined> {
  const log = createLogger(`add:dlc:${file.titleID}`);
  log.info(
    `Trying to match DLC to an existing game -> ${file.titleIDBaseGame}`
  );

  const gamedb = await getGameDB();
  log.debug(`Looking for parent game matching ${file.titleIDBaseGame}`);

  const matches = gamedb.findByID(file.titleIDBaseGame);
  if (matches.length) {
    const parent = matches[0].file;
    log.info(`Found matching parent game ${parent.displayName()}`);

    return {
      ...parent.assign(file),
      ...file,
      media: parent.media
    };
  }

  // If not found try to look in the NSWDB
  const nswdb = await getNSWDB();
  log.debug(
    `Looking for parent game in NSWDB matching ${file.titleIDBaseGame}`
  );

  const match = nswdb.find(file.titleIDBaseGame);
  if (match) {
    log.info(`Found Scene info, DLC for ${match.name}`);
    return { ...file.assignRelease(match) };
  }

  log.warn(
    `Unable to process the DLC file, couldn't find it in local DB or the scene db.  Try adding the parent game first!`
  );
}
