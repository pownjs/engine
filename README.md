[![Follow on Twitter](https://img.shields.io/twitter/follow/pownjs.svg?logo=twitter)](https://twitter.com/pownjs)
[![NPM](https://img.shields.io/npm/v/@pown/engine.svg)](https://www.npmjs.com/package/@pown/engine)
[![Fury](https://img.shields.io/badge/version-2x%20Fury-red.svg)](https://github.com/pownjs/lobby)
![default workflow](https://github.com/pownjs/engine/actions/workflows/default.yaml/badge.svg)
[![SecApps](https://img.shields.io/badge/credits-SecApps-black.svg)](https://secapps.com)

# Pown Engine

Pown Engine is a generic scripting and execution environment. It is used by other pown tools to provide a simle extension mechanism for task-based plugins. For example, [recon](https://github.com/pownjs/recon) is using this library to for its own template-based scripting language.

## Credits

This tool is part of [secapps.com](https://secapps.com) open-source initiative.

```
  ___ ___ ___   _   ___ ___  ___
 / __| __/ __| /_\ | _ \ _ \/ __|
 \__ \ _| (__ / _ \|  _/  _/\__ \
 |___/___\___/_/ \_\_| |_|  |___/
  https://secapps.com
```

### Authors

* [@pdp](https://twitter.com/pdp) - https://pdparchitect.github.io/www/

## Quickstart

This tool is meant to be used as part of [Pown.js](https://github.com/pownjs/pown), but it can be invoked separately as an independent tool.

Install Pown first as usual:

```sh
$ npm install -g pown@latest
```

Install engine:

```sh
$ pown modules install @pown/engine
```

Invoke directly from Pown:

```sh
$ pown engine
```

### Standalone Use

Install this module locally from the root of your project:

```sh
$ npm install @pown/engine --save
```

Once done, invoke pown cli:

```sh
$ POWN_ROOT=. ./node_modules/.bin/pown-cli engine
```

You can also use the global pown to invoke the tool locally:

```sh
$ POWN_ROOT=. pown engine
```

## Usage

> **WARNING**: This pown command is currently under development and as a result will be subject to breaking changes.

```
pown-cli [options] <command> [command options]

Commands:
  pown-cli modules <command>      Module manager  [aliases: module, mo, m]
  pown-cli preferences <command>  Preferences  [aliases: prefs]

Options:
  --version  Show version number  [boolean]
  --help     Show help  [boolean]
```

## Programming

See `./examples` for examples to use this library in your own projects.
