<h1 align="center" style="border-bottom: none;">nxbm 🚀</h1>
<h3 align="center">A backup manager for the Nintendo Switch</h3>
<p align="center">
  <a href="https://circleci.com/gh/jordond/nxbm">
    <img alt="CircleCI All" src="https://img.shields.io/circleci/project/github/jordond/nxbm.svg">
  </a>
  <a href="https://circleci.com/gh/jordond/nxbm/tree/master">
    <img alt="CircleCI Stable" src="https://img.shields.io/circleci/project/github/jordond/nxbm/master.svg">
  </a>
  <a href="https://circleci.com/gh/jordond/nxbm/tree/develop">
    <img alt="CircleCI Develop" src="https://img.shields.io/circleci/project/github/jordond/nxbm/develop.svg">
  </a>
</p>
<p align="center">
  <a href="https://greenkeeper.io">
    <img alt="Greenkeeper" src="https://badges.greenkeeper.io/jordond/nxbm.svg">
  </a>
  <a href="https://david-dm.org/jordond/nxbm">
    <img alt="Dependencies" src="https://david-dm.org/jordond/nxbm/status.svg">
  </a>
  <a href="https://david-dm.org/jordond/nxbm?type=dev">
    <img alt="Dev Dependencies" src="https://david-dm.org/jordond/nxbm/dev-status.svg">
  </a>
</p>
<p align="center">
  <a href="https://waffle.io/jordond/nxbm">
    <img alt="Waffle.io" src="https://badge.waffle.io/jordond/nxbm.svg?columns=all">
  </a>
</p>

**nxbm** is a backup manager for Nintento Switch games. For managing, and displaying detailed information and media about your game collection

**NOTE:** This project is in the very early stages, and currently only has a working API and file scanner/parser.

## Highlights

- Runs on Windows, Linux, and Mac OSX
- Automatic folder scanning
- Supports both NSP and XCI files
- Auto download latest version of hactool
  - Automatically compiles binaries on Mac and Linux
- Fetch detailed information from the [Scene Database](http://nswdb.com/)
- **Optional**
  - Download extra information from the EShop, and [TGDB](https://thegamesdb.net/)
  - Download box artwork from TGDB

## Packages

**nxbm** will be available in a couple different ways:

1. standalone server
   - Download, and use Node to run **nxbm**
   - To be run locally on your computer, or a NAS server
1. Docker container
   - an All-in-one solution for running **nxbm**
   - All of the runtimes and build tools required
1. Desktop client
   - Using [electron](https://electronjs.org/), you can run **nxbm** as a desktop application
   - Has the ability to connect to a **nxbm** server instance

## Requirements

The following are required for running **nxbm**. Unless you use the supplied Docker container.

- Node (v8+)
- Python2
  - **Required** for parsing the XCI files
  - ensure you have `python2` available on your path
- CLI build tools
  - **Note** Windows users will not need this as SciresM provieds the binaries for Windows
  - For compiling [hactool](https://github.com/SciresM/hactool)

## Installation

WIP

Right now there are no releases as the project is still in early development. However if you would like to try it out anyways, follow these steps.

Open a terminal window:

```bash
# Clone the repo
git clone https://github.com/jordond/nxbm
cd nxbm

# Install all the dependencies
yarn # or `npm install`

# Build and package the standalone version
yarn package:standalone

# The packaged binary will be in ./build/bin/standalone
# Move it elsewhere, or run with node
node ./build/bin/standalone/nxbm.js
```

Once you have the project open, navigate to `localhost:9999` to see the Web UI.

## Configuration

### WIP

After the first run find `./data/config.json`, and edit what you need. Or override the config by passing the flags to the CLI.

ex:

```bash
node ./nxbm.js --port 80 --level verbose --downloadKeys
```

## Contributing

All contributions are welcome! This repository uses [commitizen](https://github.com/commitizen/cz-cli) as a standard for commit messages. That way a clean changelog can be created. So use `yarn commit` to create your commit message.

This repo is setup as a monorepo using [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html). The core functionality of **nxbm** is located in the `lib/` folder, while the consumers of that functionality are located in the `packages/` folder.

### Shared steps

1. Fork the repo, then clone it
1. Install dependencies (`yarn` or `npm install`)

### Working on the `lib` files

1. Run `yarn dev:lib`
1. Make changes and TypeScript will automatically compile them.

### Working on the backend api

1. Follow the steps for working on the `lib` files
1. Open a seperate terminal session
1. Run `yarn dev:api`
1. Webpack will bundle all the files, and watch for changes.

- Webpack will also watch for the output of changes to the `lib` files as well

1. The API will be available at `localhost:9999/api`

### Working on the full stack

1. Follow the steps for working on the `lib` files
1. Open a seperate terminal session
1. Run `yarn dev:bin`
1. The API will be available at `localhost:9999/api`
1. The web ui will be available at `localhost:10000`

### Commiting

1. Run `yarn commit` to create your commit message
1. Follow the prompts and be as detailed as possible
1. Fix any linter errors
1. Open up a Pull Request to the `develop` branch
1. Wait for approval

## License

```text
MIT License

Copyright (c) 2018 Jordon de Hoog

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
