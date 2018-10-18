#!/bin/bash

# Download and unzip the latest artifact from a github release
# Usage:
#   ./init.sh <owner/repo> [working_dir] [output_dir]
# Ex:
#   ./init.sh jordond/test /tmp/test /opt/test
#
# Note: If the script is failing, Github might be rate-limiting you.  Add an oauth token to your env: GH_TOKEN="oauthkey"

WORKING_DIR=$2
if [ -z "$WORKING_DIR" ]; then
  WORKING_DIR="."
fi

OUTPUT_DIR=$3

cd "$WORKING_DIR"

if [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="."
fi

GH_OPTS=""
if [ -z "$GH_TOKEN" ]; then
  echo "Warning: No github token was found in the ENV, you will most likely be rate limited"
else
  GH_OPTS="?access_token=$GH_TOKEN"
fi

echo "Working dir: $WORKING_DIR"
echo "Output dir: $OUTPUT_DIR"

touch "version"
LATEST=$(curl --silent "https://api.github.com/repos/$1/releases/latest$GH_OPTS" \
  | grep '"tag_name":' \
  | sed -E 's/.*"([^"]+)".*/\1/' \
  | tr -d '[:space:]')

EXISTING=$(cat version | tr -d '[:space:]')

if [ -z "$LATEST" ]; then
  echo "Unable to find a release for $1"
  exit 1
else
  echo "The latest release is: $LATEST"
fi

if [ ! -z "$EXISTING" ]; then
  echo "Found an existing version: $EXISTING"

  if [ "$EXISTING" = "$LATEST" ]; then
    echo "There is no update"
    exit 0
  else
    echo "Looks like there is an update available!"
  fi
fi

FILE=$(curl -s https://api.github.com/repos/$1/releases/latest$GH_OPTS \
  | grep ".*/download/.*standalone.*\.zip" \
  | cut -d '"' -f 4)

if [ -z "$FILE" ]; then
  echo "Unable to find matching file for $1"
  exit 1
fi

echo "Downloading $FILE..."
wget -q $FILE

TARGET=$(find . | grep '.*\.zip')
echo "Unzipping $TARGET..."
unzip "$TARGET" -d "$OUTPUT_DIR"

echo "Moving to $OUTPUT_DIR"
mv  $OUTPUT_DIR/standalone/* $OUTPUT_DIR

echo "Cleaning up..."
rm $TARGET
rm -rf $OUTPUT_DIR/standalone

# Create a version file to compare at a later time
echo "$LATEST" > "version"