#!/usr/bin/env bash

msg="sync"

[ -n "$1" ] && msg="$1"

git pull
git add .
git stage .
git commit -m "$msg"
git push
