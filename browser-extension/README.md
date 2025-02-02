# Quick Edits

![build](https://github.com/chibat/chrome-extension-typescript-starter/workflows/build/badge.svg)

Chrome Extension, TypeScript and Visual Studio Code

## Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

## Option

* [Visual Studio Code](https://code.visualstudio.com/)

## Includes the following

* TypeScript
* Webpack
* React
* Jest
* Example Code
  * Chrome Storage
  * Options Version 2
  * content script
  * count up badge number
  * background

## Project Structure

* src/typescript: TypeScript source files
* src/assets: static files
* dist: Chrome Extension directory
* dist/js: Generated JavaScript files

## Setup

```bash
npm install
```

## Import as Visual Studio Code project

...

## Build

```bash
npm run build
```

## Build in watch mode

### terminal

```bash
npm run watch
```

### Visual Studio Code

Run watch mode.

type `Ctrl + Shift + B`

## Load extension to chrome

Load `dist` directory

## Test

`npx jest` or `npm run test`

## Configure Native Messaging

* <https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging>

## Structure

The tailwind folder was downloaded from <https://github.com/tailwindlabs/tailwindcss/tree/515a9bdc5ff77291d6f41cd1d4c22e9d24ea91bc/packages/tailwindcss>
