#!/bin/bash -x

TARGET=dist/chrome.crx
mkdir -p dist
zip $TARGET *.js *.css *.html *.json web/* icons/* _locales/*/*
unzip -l $TARGET