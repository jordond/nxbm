#!/bin/bash

echo "Getting latest version"
/scripts/getLatest.sh jordond/test /build /nxbm

# TODO - Use PM2? or something else
echo "Starting nxbm..."
node index.js