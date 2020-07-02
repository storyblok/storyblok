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

```sh
$ storyblok sync --type <COMMAND> --source <SPACE_ID> --target <SPACE_ID>
```

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

### generate-migration

Create a migration file (with the name `change_<COMPONENT>_<FIELD>.js`) inside the `migrations` folder. Check **Migrations** section to more details

```sh
$ storyblok generate-migration --space <SPACE_ID> --component <COMPONENT_NAME> --field <FIELD>
```

#### Options

* `space`: space where the component is
* `component`: component name. It needs to be a valid component
* `field`: name of field

### run-migration

Execute a specific migration file. Check **Migrations** section to more details

```sh
$ storyblok run-migration --space <SPACE_ID> --component <COMPONENT_NAME> --field <FIELD> --dryrun
```

#### Options

* `space`: space where the component is
* `component`: component name. It needs to be a valid component
* `field`: name of field
* `dryrun`: when passed as an argument, does not perform the migration

### Help

For global help

```sh
$ storyblok --help
```

For command help

```sh
$ storyblok sync --help
```

### Version

For view the CLI version

```sh
$ storyblok -V # or --version
```

## Content migrations

Content migrations are a convenient way to change fields of your content.

To execute a migration you first need to create a migration file. This file is a pure Javascript function where the content of a specific content type or compontent gets passed through.

### 1. Creating a migration file

To create a migration file, you need to execute the `generate-migration` command:

```sh
# creating a migration file to product component to update the price
$ storyblok generate-migration --space 00000 --component product --field price
```

When you run this command a file called `change_product_price.js` will be created inside a folder called `migrations`.

The created file will have the following content:

```js
// here, 'subtitle' is the name of the field defined when you execute the generate command
module.exports = function (block) {
  // Example to change a string to boolean
  // block.subtitle = !!(block.subtitle)

  // Example to transfer content from other field
  // block.subtitle = block.other_field
}
```

In the migration function you can manipulate the block variable to add or modify existing fields of the component.

### 2. Running the migration file

To run the migration function you need to execute the `run-migration` command. Pass the --dryrun option to not execute the updates and only show the changes in the terminal:

```sh
$ storyblok run-migration --space 00000 --component product --field price --dryrun
```

After checking the output of the dryrun you can execute the updates:

```sh
# you can use the --dryrun option to not execute the updates
$ storyblok run-migration --space 00000 --component product --field price
```

### Examples


#### 1. Change an image field

Let's create an example to update all occurrences of the image field in product component. In the example we replace the url from `//a.storyblok.com` to `//my-custom-domain.com`.

First, you need to create the migration function:

```sh
$ storyblok generate-migration --space 00000 --component product --field image
```

Then let's update the default image field:

```js
module.exports = function (block) {
  block.image = block.image.replace('a.storyblok.com', 'my-custom-domain.com')
}
```

Now you can execute the migration file:

```sh
$ storyblok run-migration --space 00000 --component product --field image --dryrun
```

#### 2. Transform a Markdown field into a Richtext field


To transform a markdown or html field into a richtext field you first need to install a converter library.

```sh
$ npm install storyblok-markdown-richtext -g
```

Now check the path to the global node modules folder

```sh
$ npm root -g
```

Generate the migration with ```storyblok generate-migration --space 00000 --component blog --field intro``` and apply the transformation:

```js
var richtextConverter = require('/usr/local/lib/node_modules/storyblok-markdown-richtext')

module.exports = function (block) {
  if (typeof block.intro == 'string') {
    block.intro = richtextConverter.markdownToRichtext(block.intro)
  }
}
```

## You're looking for a headstart?

Check out our guides for client side apps (VueJS, Angular, React, ...), static site (Jekyll, NuxtJs, ...), dynamic site examples (Node, PHP, Python, Laravel, ...) on our [Getting Started](https://www.storyblok.com/getting-started) page.
