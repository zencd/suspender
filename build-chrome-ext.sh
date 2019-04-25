#!/bin/bash -x

TARGET=dist/chrome.zip
mkdir -p dist
rm -f $TARGET
zip $TARGET *.js *.css *.html manifest.json _locales/*/* aspects/* icons/* web/*
unzip -l $TARGET