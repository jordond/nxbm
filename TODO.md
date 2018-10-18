# TODO

## Architecture

- In the electron version, allow it to connect to a dedicated server (enter manually, or using bonjour)
  - or run it's own instance

### Final Outputs

- Electron:
  - bundles, api-server, scanner, web-ui into one
- Setup automatic github releases from master
  - Semantic release?

## General

- Sockets
  - Socket communication for events, (add, delete, parse, etc)
- Switch `GameDB` to have a list of `Game[]` instead of `xci: Game[], nsp: Game[]`

- Have a "first run", that generates a config file the user can use to edit

## API

### Files (mvp)

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

## Niceties

- Create an electron app, to use locally and crossplatform
- Use semantic release with github for assets
- Have circleci build electron for all platforms
- Add build artifacts to github releases
  - Allow electron app to run in "standalone" mode or "client" mode
    - Standalone, runs the whole thing contained, client searches for a server on the network

## Far future

- Look into integrating with homebrew app store
  - Generate repo.json
  - more info [here](https://github.com/vgmoose/appstorenx#maintaining-a-repo)
