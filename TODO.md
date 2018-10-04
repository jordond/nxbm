## Architecture

- Use Bonjour to broadcast server ip address
  - In the electron version, allow it to connect to a dedicated server (enter manually, or using bonjour)
    - or run it's own instance
- Queue
  - Add a queue for adding xci/nsp files. If the server starts up and tries to process 200 files at a time, but be crazy
  - A\*) Maybe each add event, adds to the queue
    - First add, starts a timeout timer (5 seconds?)
  - When the timer runs out, or the max per run is hit (10?)
  - Start processing files
    - While queue is running, if a new file is added, add it to the backlog
    - when queue is finished, go back to step A\*

### Final Outputs

- Docker:
  - Uses standalone
- Electron:
  - bundles, api-server, scanner, web-ui into one
- Setup automatic github releases from master
  - Semantic release?

## General

- Sockets
  - Socket communication for events, (add, delete, parse, etc)
- Switch `GameDB` to have a list of `Game[]` instead of `xci: Game[], nsp: Game[]`

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
