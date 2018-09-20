#!/bin/sh

if [ -z "$1" ]; then
    echo "No projects specified, building all"
    yarn build:lib
    yarn build:src
else
    for proj in "$@"
    do
      projects="--scope @nxbm/$proj $projects"
    done
    yarn lerna run build --stream $projects
fi