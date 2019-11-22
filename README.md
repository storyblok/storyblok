<p align="center">
  <h1 align="center">Storyblok CLI</h1>
  <p align="center">A simple CLI for scaffolding <a href="https://www.storyblok.com" target="_blank">Storyblok</a> projects and fieldtypes.</p>
</p>

You found an issue?<br>Tell us about it - <a href="https://github.com/storyblok/storyblok/issues/new">open an issue</a> or look if it was <a href="https://github.com/storyblok/storyblok/issues/">already reported</a>.

[![npm](https://img.shields.io/npm/v/storyblok.svg)](https://www.npmjs.com/package/storyblok)
[![npm](https://img.shields.io/npm/dt/storyblok.svg)](ttps://img.shields.io/npm/dt/storyblok.svg)
[![GitHub issues](https://img.shields.io/github/issues/storyblok/storyblok.svg?style=flat-square&v=1)](https://github.com/storyblok/storyblok/issues?q=is%3Aopen+is%3Aissue)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/storyblok/storyblok.svg?style=flat-square&v=1)](https://github.com/storyblok/storyblok/issues?q=is%3Aissue+is%3Aclosed)

## Installation

Make sure you've node `>= 9.11.0` installed.

```sh
$ npm i storyblok -g
```

## Commands

### select

Usage to kickstart a boilerplate, fieldtype or theme

```sh
$ storyblok select
```

### pull-components

Download your space's components schema as json

```sh
$ storyblok pull-components --space <SPACE_ID>
```

#### Options

* `space`: your space id

### push-components

Push your components file to your/another space

```sh
$ storyblok push-components <SOURCE> --space <SPACE_ID>
```

#### Parameters

* `source`: can be a URL or path to JSON file.

Using an **URL**

```sh
$ storyblok push-components https://raw.githubusercontent.com/storyblok/nuxtdoc/master/seed.components.json --space 67819
```

Using a **path** to file

```sh
$ storyblok push-components ./components.json --space 67819
```

#### Options

* `space`: your space id

### sync

Sync components, folder, roles or stories between spaces

$ storyblok sync --command <COMMAND> --source <SPACE_ID> --target <SPACE_ID>

#### Options

* `type`: describe the command type to execute. Can be: `folders`, `components`, `stories` or `roles`. It's possible pass multiple types separated by comma (`,`).
* `source`: the source space to use to sync
* `target`: the target space to use to sync

#### Examples

```sh
# Sync components from `00001` space to `00002` space
$ storyblok sync --type components --source 00001 --target 00002

# Sync components and stories from `00001` space to `00002` space
$ storyblok sync --type components,stories --source 00001 --target 00002
```

### quickstart

Create a space in Storyblok and select the boilerplate to use

```sh
$ storyblok quickstart
```

### logout

Logout from the Storyblok cli

```sh
$ storyblok logout
```

### login

Login to the Storyblok cli

```sh
$ storyblok login
```

### Help

For global help

```sh
$ storyblok --help
```

For command help

```sh
$ storyblok sync --help
```

## You're looking for a headstart?

Check out our guides for client side apps (VueJS, Angular, React, ...), static site (Jekyll, NuxtJs, ...), dynamic site examples (Node, PHP, Python, Laravel, ...) on our [Getting Started](https://www.storyblok.com/getting-started) page.