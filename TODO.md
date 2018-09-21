## Architecture

- Move endpoint handler from `api-server` to `api-endpoints` \* Maybe
- Move api-server logic into new package
- Create new package for the backend i.e. bootstrap.ts, calls server.ts
  - Use webpack to bundle all the node code
  - Make sure `__dirname` points to one level up
  - Mark all dependencies as external (except @nxbm/)
- Build script that will run `backend`.build, and `web`.build
  - Output to /dist (top level)
  - Include package.json for deps
- Somehow make the web project aware of api server address
  - Or create a project that grabs the backend and web into a single package

### Final Outputs

- standalone:
  - api-server, scanner, web-ui
- Docker:
  - Uses standalone
- Electron:
  - bundles, api-server, scanner, web-ui into one

## General

- Parse NSP
- ~~Prune db of missing files~~
  - ~~If a file is missing on startup (ex not detected by the folder scanner)~~
  - ~~Mark it as 'missing' (property on the `Game`?)~~
  - Still return it with API calls, but UI should grey it out
- Sockets
  - Socket communication for events, (add, delete, parse, etc)
- Switch `GameDB` to have a list of `Game[]` instead of `xci: Game[], nsp: Game[]`
- Update Config to use `Partial<>` instead of always optional

- Change `Game` to `File` and vice-versa
- For each API endpoint

- Have a "first run", that generates a config file the user can use to edit

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
- Use bonjour to broadcast api serve to web server
  - Allow electron app to run in "standalone" mode or "client" mode
    - Standalone, runs the whole thing contained, client searches for a server on the network

## Far future

- Look into integrating with homebrew app store
  - Generate repo.json
  - more info [here](https://github.com/vgmoose/appstorenx#maintaining-a-repo)
