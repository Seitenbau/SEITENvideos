# SBideo [![Build Status](https://travis-ci.org/Seitenbau/SBideo.svg?branch=master)](https://travis-ci.org/Seitenbau/SBideo) [![Dependencies](https://david-dm.org/Seitenbau/SBideo.svg)](https://david-dm.org/Seitenbau/SBideo)

A very simplistic video archive including video transcoding and following features:

* web interface for listing all videos in a flexible multi-level folder structure
* video player
* editable metadata for videos and folders e.g. title, description, speaker, tags ([in development](https://github.com/Seitenbau/SBideo/pull/19))
* ultra fast client-side fuzzy search through video metadata
* async video transcoding from any ffmpeg supported format to mp4
* simple file system based data structure, no database required
* integrated web- and pseudo-streaming server (express)
* very lightweight client-side code: total 28kb JS + 6kb CSS gzipped (based on [preact-cli](https://github.com/developit/preact-cli))

## CLI Commands

```bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# test the production build locally
npm run serve

# run tests with jest and preact-render-spy
npm run test

# code linting
npm run lint
```

For detailed explanation on how things work, checkout the [CLI Readme](https://github.com/developit/preact-cli/blob/master/README.md).

## Basic usage

You can use the `data` folder in this repo as a reference for your directory layout. You can serve any folder having a structure like `data` by altering the parameter of `server.js`.

## Uploading and transcoding files

For video transcoding you also need a working [ffmpeg](https://www.ffmpeg.org/) installation.

In addition to the server, run

```sh
node transcode.js ./incoming ./data
```

Every time you add video files into the folder `incoming`, the transcoding will start automatically. After transcoding is done, the new videos will be visible in the frontend.

## Migrate script

In case you want to migrate an old file based video archive, check the branch [migrateScript](https://github.com/Seitenbau/SBideo/tree/migrateScript); maybe it helps.

# Credits

This project was initially created at [SEITENBAU Hackathon 2017](https://hackathon.seitenbau.com/).

Demo videos: (c) copyright 2008, Blender Foundation / www.bigbuckbunny.org
