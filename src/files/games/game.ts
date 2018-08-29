import { map } from "bluebird";
import { pathExists } from "fs-extra";
import { basename } from "path";

import { create } from "../../logger";
import { File } from "../parser/models/File";
import { isBlacklisted } from "./blacklist";
import { getGameDBPath, loadGameDB, saveGameDB } from "./db";
import { Game } from "./game";

export interface Game {
  file: File;
  added: Date;
  missing?: boolean;
  blacklist?: boolean;
}

export interface IGameDB {
  xcis: Game[];
}

export class GameDB implements IGameDB {
  public xcis: Game[];
  private log = create("GameDB");

  constructor({ xcis }: IGameDB = { xcis: [] }) {
    this.xcis = xcis;
  }

  public save() {
    return saveGameDB(this);
  }

  public async load() {
    const result = await loadGameDB();
    if (result) {
      this.xcis = result.xcis;
      return true;
    }
    return false;
  }

  public dbPath = () => getGameDBPath();

  public find(game?: File) {
    if (!game) {
      return;
    }
    this.log.debug(`Searching DB for ${game.displayName()}`);
    return this.xcis.find(({ file }) => file.id() === game.id());
  }

  public findByID(titleID: string) {
    this.log.debug(`Searching DB for id: ${titleID}`);
    return this.xcis.filter(xci => xci.file.titleID === titleID);
  }

  public findByFileName(filename: string) {
    this.log.debug(`Searching DB for game matching: ${filename}`);

    let found = this.xcis.find(({ file }) => file.filepath === filename);
    if (!found) {
      this.log.debug(
        `Searching for just the filename -> ${basename(filename)}`
      );
      found = this.xcis.find(
        ({ file }) => file.filename === basename(filename)
      );
    }

    return found;
  }

  public has(game: File) {
    return this.find(game) !== null;
  }

  public async add(file: File) {
    this.log.verbose(`Adding ${file.displayName()} to database`);

    const game: Game = {
      file,
      added: new Date()
    };
    this.xcis.push(game);

    return game;
  }

  public markMissing(game: Game) {
    this.log.verbose(`Marking ${game.file.displayName()} as missing`);
    const found = this.xcis.find(({ file }) => file.id() === game.file.id());
    if (found) {
      found.missing = true;
      return true;
    }
    return false;
  }

  public remove(game: Game) {
    this.log.verbose(`Deleting ${game.file.displayName()}`);
    this.xcis = this.xcis.filter(({ file }) => file.id() !== game.file.id());
  }

  public async check(removeOnBlacklist: boolean = false) {
    const files = await map(this.xcis, async (xci: Game) => {
      this.log.debug(`Checking if ${xci.file.displayName()} exists`);

      const exists = await pathExists(xci.file.filepath);
      if (!exists) {
        this.log.info(
          `${xci.file.displayName()} could not be located! Marking as missing`
        );
      }
      xci.missing = !exists;

      const blacklisted = isBlacklisted(xci.file);
      if (blacklisted) {
        this.log.info(`${xci.file.displayName()} is blacklisted!`);
      }
      xci.blacklist = blacklisted;

      return xci;
    }).filter(game => {
      const keep = !removeOnBlacklist || game.blacklist === false;
      if (!keep) {
        this.log.info(`Removing blacklisted file ${game.file.displayName()}`);
      }
      return keep;
    });

    this.xcis = files;
    this.save();
  }
}