import { createLogger } from "@nxbm/core";
import { Game, IFile, IGameDB } from "@nxbm/types";
import { map as PromiseMap } from "bluebird";
import { pathExists } from "fs-extra";
import { basename } from "path";

import { isBlacklisted } from "./blacklist";
import { getGameDBPath, loadGameDB, saveGameDB } from "./db";

export class GameDB implements IGameDB {
  public games: Map<string, Game>;

  private log = createLogger("GameDB");

  constructor(games: Game[] = []) {
    this.games = this.fromList(games);
  }

  public fromList = (games: Game[]) =>
    games.reduce(
      (map, game) => map.set(game.file.id(), game),
      new Map<string, Game>()
    );

  public toList = () => Array.from(this.games.values());

  public uniqueTitleIds = (): Game[] =>
    Array.from(
      this.toList()
        .reduce(
          (map, item) => map.set(item.file.titleIDBaseGame, item),
          new Map<string, Game>()
        )
        .values()
    );

  public addAll = (games: Game[]) =>
    games.forEach(game => this.games.set(game.file.id(), game));

  public save() {
    return saveGameDB(this.toList());
  }

  public async load() {
    const result = await loadGameDB();
    if (result) {
      this.games = this.fromList(result);
      return true;
    }
    return false;
  }

  public dbPath = () => getGameDBPath();

  public find(game?: IFile) {
    if (!game) {
      return;
    }
    this.log.debug(`Searching DB for ${game.displayName()}`);
    return this.games.get(game.id());
  }

  public findByID(titleID: string) {
    this.log.debug(`Searching DB for id: ${titleID}`);
    return this.toList().filter(xci => xci.file.titleID === titleID);
  }

  public findByFileName(filename: string) {
    this.log.debug(`Searching DB for game matching: ${filename}`);

    let found = this.toList().find(({ file }) => file.filepath === filename);
    if (!found) {
      this.log.debug(
        `Searching for just the filename -> ${basename(filename)}`
      );
      found = this.toList().find(
        ({ file }) => file.filename === basename(filename)
      );
    }

    return found;
  }

  public has(game: IFile) {
    return this.find(game) !== null;
  }

  public async add(file: IFile) {
    this.log.verbose(`Adding ${file.displayName()} to database`);

    const game: Game = {
      file,
      added: new Date()
    };
    this.games.set(file.id(), game);

    return game;
  }

  public async update(file: IFile) {
    this.log.verbose(`Updating ${file.displayName()}`);

    const found = this.find(file);
    if (!found) {
      this.add(file);
      return;
    }

    this.games.set(found.file.id(), { ...found, file });
  }

  public markMissing(game: Game, isMissing: boolean = true) {
    this.log.verbose(`Marking ${game.file.displayName()} as missing`);
    const found = this.games.get(game.file.id());
    if (found) {
      found.missing = isMissing;
      this.update(found.file);
      return true;
    }
    return false;
  }

  public remove(game: Game) {
    this.log.verbose(`Deleting ${game.file.displayName()}`);
    this.games.delete(game.file.id());
  }

  public async check(removeOnBlacklist: boolean = false) {
    const files = await PromiseMap(this.toList(), async (xci: Game) => {
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

    this.addAll(files);
    this.save();
  }
}
