# nxbm-server docker container

A container for running [nxbm](https://github.com/jordond/nxbm) in server mode.
Use this docker on your NAS, then use the desktop client to connect to it, or use the webgui.

## Features

- Runs nxbm-server in a self contained environment, easy to reinstall/move around.
- Checks if an update is needed on every restart. Will automatically update and compile.
- Ability to:
  - Persistently store the `/data` directory. (Useful for recreating image)

## Building

Available on [docker hub](https://hub.docker.com/r/jordond/nxbm/), or you can build it yourself.

### Manual

1. Clone the repo `git clone https://github.com/jordond/nxbm`
1. Change into directory `cd nxbm`
1. Build the docker image `yarn build:docker` or `npm run build:docker`
   - Or run the docker command yourself `docker build -t jordond/nxbm packages/docker

## Running

```bash
docker run -d \
  --name=nxbm-server \
  --restart=always \
  -p <PORT>:9999 \
  -v <PATH_TO_DATA>:/data \
  jordond/nxbm
```

### Options

- `-p <PORT>:9999`: Local port to map to server
- `-v <PATH_TO_DATA>:/data`: Directory to store all application data, ie: database, config, etc

## License

```text
The MIT License (MIT)

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
