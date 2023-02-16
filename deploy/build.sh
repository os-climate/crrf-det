#!/usr/bin/env bash

if [ "$1" = "" ]
then
  echo "Usage: $0 <BACKEND_ENDPOINT_BASE e.g. '//localhost:8000'>"
  exit
fi

docker build --rm -f dockerfile_fe --progress plain --build-arg BACKEND_ENDPOINT_BASE="$1" -t det-fe-dist ../
docker build --rm -f dockerfile_be -t det-be-dist ../
docker images
