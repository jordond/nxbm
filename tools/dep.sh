#!/bin/sh

if [ -z "$1" ]; then
    echo "No command specified"
    exit 1
else
    project="@nxbm/$1"
    cmd=$2
    shift 2
    for dep in "$@"
    do
      deps="$deps $dep"
    done
    yarn workspace $project $cmd $deps
fi