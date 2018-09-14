#!/bin/sh

if [ -z "$1" ]; then
    echo "No argument supplied"
    exit 1
else
    project=$1
    shift
    yarn workspace @nxbm/$project "$@"
fi