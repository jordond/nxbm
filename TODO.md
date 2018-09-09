## General

- Parse NSP
- ~~Prune db of missing files~~
  - ~~If a file is missing on startup (ex not detected by the folder scanner)~~
  - ~~Mark it as 'missing' (property on the `Game`?)~~
  - Still return it with API calls, but UI should grey it out
- Sockets
  - Socket communication for events, (add, delete, parse, etc)
- thegamesdb - Scrape information from here instead of nintendo
- Switch `GameDB` to have a list of `Game[]` instead of `xci: Game[], nsp: Game[]`
- Update Config to use `Partial<>` instead of always optional
- Add `cleanup` to the config file, to stop deleting of hactool temp files
- On startup, even if file is already in the DB, check to see if it has the SCENE information set
- Use NEDB or some other type of json db for the games, probably not great to just write to a json file, not thread safe

- Change `Game` to `File` and vice-versa

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

- `GET : /games/{titleid}/media`
  - Return an object containing all media
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
