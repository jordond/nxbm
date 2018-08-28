import { filter } from "bluebird";
import { pathExists } from "fs-extra";
import { basename } from "path";

import { create } from "../../logger";
import { File } from "../parser/models/File";
import { getGameDBPath, loadGameDB, saveGameDB } from "./db";

export interface IGameDB {
  xci: File[];
}

export class GameDB implements IGameDB {
  public xci: File[];
  private log = create("GameDB");

  constructor({ xci }: IGameDB = { xci: [] }) {
    this.xci = xci;
  }

  public save() {
    return saveGameDB(this);
  }

  public async load() {
    const result = await loadGameDB();
    if (result) {
      this.xci = result.xci;
      return true;
    }
    return false;
  }

  public dbPath = () => getGameDBPath();

  public find(game: File) {
    this.log.debug(`Searching DB for ${game.displayName()}`);
    return this.xci.find(xci => xci.id() === game.id());
  }

  public findByFileName(filename: string) {
    this.log.debug(`Searching DB for game matching: ${filename}`);

    let found = this.xci.find(xci => xci.filepath === filename);
    if (!found) {
      this.log.debug(
        `Searching for just the filename -> ${basename(filename)}`
      );
      found = this.xci.find(xci => xci.filename === basename(filename));
    }

    return found;
  }

  public has(game: File) {
    return this.find(game) !== null;
  }

  public add(game: File) {
    this.log.verbose(`Adding ${game.displayName()} to database`);
    this.xci.push(game);
  }

  public remove(game: File) {
    this.log.verbose(`Deleting ${game.displayName()}`);
    this.xci = this.xci.filter(xci => xci.id() !== game.id());
  }

  // TODO - Add option to disable removing missing files?
  public async prune() {
    const existingFiles = await filter(this.xci, async (xci: File) => {
      this.log.debug(`Checking if ${xci.displayName()} exists`);
      const exists = await pathExists(xci.filepath);
      if (!exists) {
        this.log.info(`${xci.displayName()} could not be located, removing`);
      }
      return exists;
    });

    if (existingFiles.length !== this.xci.length) {
      this.xci = existingFiles;
      this.save();
    }
  }
}
