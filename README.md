<p align="center">
  <h1 align="center">Storyblok CLI</h1>
  <p align="center">A simple CLI for scaffolding <a href="https://storyblok.com" target="_blank">Storyblok</a> projects and fieldtypes.</p>
</p>

You found an issue?<br>Tell us about it - <a href="https://github.com/storyblok/storyblok/issues/new">open an issue</a> or look if it was <a href="https://github.com/storyblok/storyblok/issues/">already reported</a>.

[![npm](https://img.shields.io/npm/v/storyblok.svg)](https://www.npmjs.com/package/storyblok)
[![npm](https://img.shields.io/npm/dt/storyblok.svg)](ttps://img.shields.io/npm/dt/storyblok.svg)
[![GitHub issues](https://img.shields.io/github/issues/storyblok/storyblok.svg?style=flat-square&v=1)](https://github.com/storyblok/storyblok/issues?q=is%3Aopen+is%3Aissue)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/storyblok/storyblok.svg?style=flat-square&v=1)](https://github.com/storyblok/storyblok/issues?q=is%3Aissue+is%3Aclosed)

## Installation

Make sure you've node `>= 5.11.0` installed.

```
$ npm i storyblok -g
```

## Usage for the quickstart
```
$ storyblok quickstart
```

## Usage for fieldtypes and other boilerplates
```
$ storyblok select
```

## Download your space's components schema as json
```
$ storyblok pull-components --space={{your_space_id}}
```

## Push your components file to your/another space
```
$ storyblok push-components --space={{your_dest_space_id}} {{path/url}}
```

## What it does
We recommend to execute the quickstart command first to learn how easy it is to use Storyblok.

The CLI allows developers to get started with a new Storyblok project by answering 3 questions:
1. How should your Project be named?
2. Select the type of your project (Theme/Boilerplate/Fieldtype)
3. Select your Theme/Boilerplate (skipped for Fieldtypes)

## How will it look like
<img src="https://a.storyblok.com/f/39898/d26d369183/storyblok-cli.gif" alt="How to use the Storyblok cli">

## Themes
- Creator Theme (Blueprint) [https://github.com/storyblok/creator-theme]
- City Theme [https://github.com/storyblok/city-theme]
- Nexo Theme [https://github.com/storyblok/nexo-theme]

## Boilerplates
- PHP - Silex Boilerplate [https://github.com/storyblok/silex-boilerplate]
- JavaScript - NodeJs Boilerplate [https://github.com/storyblok/nodejs-boilerplate]
- Ruby - Sinatra Boilerplate [https://github.com/storyblok/sinatra-boilerplate]
- Python - Django Boilerplate [https://github.com/storyblok/django-boilerplate]
- JavaScript - VueJs Boilerplate [https://github.com/storyblok/vuejs-boilerplate]

## Fieldtypes Development Environment
- Fieldtype [https://github.com/storyblok/storyblok-fieldtype.git]

## Frequently asked questions
- **[What is Storyblok?](https://www.storyblok.com/)**        
A component composer - Storyblok augments your web framework or the technology you already use with powerful editing capabilities to bring your static websites to life. We fill the gap between a visual composer and a content collection backend system.<br><br>
- **[How can I access the Storyblok Content Delivery API?](https://www.storyblok.com/docs/Delivery-Api/introduction)**       
You can directly access the API using simple HTTP GET Requests. We've done some examples for you already in our [Delivery APi Introduction](https://www.storyblok.com/docs/Delivery-Api/introduction). <br>You can of course use one of the SDK's available for storyblok:
   - PHP SDK: https://github.com/storyblok/php-client
   - Ruby SDK: https://github.com/storyblok/storyblok-ruby
   - Android SDK: https://github.com/mikepenz/Storyblok-Android-SDK (Great work done by: [@mikepenz](https://github.com/mikepenz))
   - more are on it's way!<br><br>
- **What features is storyblok capable of?**       
You can find a full list of features which are available on the [feature](https://www.storyblok.com/features) page on our website.<br><br>
- **I'm a developer and want to start a project with storyblok**   
Glad to hear that! We've created a [CLI](https://www.storyblok.com/docs/Guides/Getting-Started) to easily bootstrap new projects directly from the command line. You can also check out our [boilerplates](https://www.storyblok.com/docs/terminology/boilerplates) and [themes](https://www.storyblok.com/docs/terminology/themes) - as well as the [content delivery api](https://www.storyblok.com/docs/Delivery-Api/introduction) itself.<br><br>

## [Terminology](https://www.storyblok.com/docs/terminology/introduction)
- **[What is a Space?](https://www.storyblok.com/docs/terminology/space)**   
A space is a content repository. Think of it as a place to keep all the content related to one project. Each space has its own components...<br><br>
- **[What is a Folder?](https://www.storyblok.com/docs/terminology/folder)**   
A folder is a collection of stories. You can create a simple structure for your content using the folders. Best examples are multilanguage/multicountry or news...<br><br>
- **[What is a Story?](https://www.storyblok.com/docs/terminology/story)**   
A story is a collection of instances of components filled with information by the content creator. You will be able to fetch a story directly by its slug...<br><br>
- **[What is a Component?](https://www.storyblok.com/docs/terminology/component)**    
A component is a standalone entity that is meaningful on its own. While components/bloks can be nested in each other, semantically they remain...<br><br>
- **[What is a Field Type?](https://www.storyblok.com/docs/terminology/field-type)**   
One field type is the smallest part in the storyblok terminology...<br><br>
- **[What is a Datasource?](https://www.storyblok.com/docs/terminology/datasource)**   
One data source is simply a collection of key-value pairs (KVP). One specific datasource-entry is a set of two linked data items: a key, which is a unique identifier...<br><br>
- **[What is a Collaborator?](https://www.storyblok.com/docs/terminology/collaborator)**   
A collaborator is a person who is explicitly a member of your project. As an owner of a space, you can choose between some roles or define...<br><br>
- **[What is a Theme?](https://www.storyblok.com/docs/terminology/themes)**   
If you want a hosting with our [Rendering Service](https://www.storyblok.com/docs/Rendering-Service/Theme-Documentation) so you won't have to setup a server on your own you can directly choose from one of...<br><br>
- **[What is a Boilerplate?](https://www.storyblok.com/docs/terminology/themes)**   
If you want to use your server or have already an existing project in which you want to integrate Storyblok you can use one of ...<br><br>
