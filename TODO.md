## General

- ~~Scan folders for added and removed xci|nsp files~~
- ~~Parse XCI~~
  - ~~titleid and revision~~
  - ~~icons~~
- Parse NSP
- ~~Prune db of missing files~~
  - ~~If a file is missing on startup (ex not detected by the folder scanner)~~
  - ~~Mark it as 'missing' (property on the `Game`?)~~
  - Still return it with API calls, but UI should grey it out
- ~~Create a "blacklist" db json file?~~
  - If a file is ignored or deleted by a user, add it to a blacklist file
  - ~~When reading the `gamedb.json` check to make sure it doesn't contain any blacklist files~~
  - ~~When adding a new game from folder scanning, ensure its not in the blacklist~~
- Sockets
  - Socket communication for events, (add, delete, parse, etc)
- thegamesdb - Scrape information from here instead of nintendo
- Switch `GameDB` to have a list of `Game[]` instead of `xci: Game[], nsp: Game[]`

## Config structure

- Watch folders:
  - Current:
    ```typescript
    interface Backups {
      folders: string[]
      ...
    }
    ```
  - Proposed:
    ```typescript
    interface Backups {
      folders: ScannerFolder[];
    }
    interface ScannerFolder {
      id: string /* Generate UUID */;
      path: string;
      recursive: boolean;
    }
    ```

## API

### Files (mvp)

- Endpoints return `Game` or `Game[]`
  - Check if missing or in the blacklist before sending to user
- ~~`GET : /games`~~
  ~~- List all games from all folders~~
- ~~`GET : /games/{titleid}`~~
  - ~~List all revisions for titleid~~
- ~~`GET : /games/{titleid}/latest`~~
  - ~~ Get newest revision for titleid~~
- ~~`GET : /games/{titleid}/{revision}`~~
  - ~~Get specific revision for title id~~
- ~~`DELETE : /games/{titleid}/{revision}`~~
- ~~`DELETE : /games/{titleid}/latest`~~
  - ~~Delete game from db (or mark as deleted?)~~
  - ~~Add to blacklist (or add blacklist property to db)~~
  - ~~optionally delete the file from disk~~
- NOTE
  - Also need to be able to get the icons for each game, from the datadir
- Optional?
  - `PUT : /games/{titleid}/latest`
    - Edit information for id (limited)

### Files (future feat)

- `POST : /games`
  - Upload a game from local to server
  - Once server retrieves it, move it to destination folder
  ```typescript
  interface AddGamePayload {
    path: string;
    destination: ScannerFolder;
  }
  ```

### Paths (mvp)

- `GET : /paths`
  - List all of the paths being scanned
- `POST : /paths`
  - payload: `ScannerFolder`
  - Add a path to the scanner
- `PUT : /paths/{id}`
  - Change the folder path
  - Requires restarting scanner
- `DELETE : /paths/{id}`
  - Stop scanning this path
  - requires restarting scanner

## Config (mvp)

- `GET : /config`
- `PUT : /config`
  - Validate payload then save config

## Niceties

- Create an electron app, to use locally and crossplatform
- Create a docker file to deploy on a server
- Use semantic release with github for assets
- Have circleci build electron for all platforms
- Add build artifacts to github releases

## Far future

- Look into integrating with homebrew app store
  - Generate repo.json
  - more info [here](https://github.com/vgmoose/appstorenx#maintaining-a-repo)
