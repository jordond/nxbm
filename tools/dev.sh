#!/bin/sh

if [ -z "$1" ]; then
    echo "No projects specified..."
else
    for proj in "$@"
    do
      projects="--scope @nxbm/$proj $projects"
    done
    yarn lerna run dev --stream $projects
fi