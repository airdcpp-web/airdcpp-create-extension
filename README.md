# airdcpp-create-extension [![Travis][build-badge]][build] [![npm package][npm-badge]][npm]

Generic starter project for creating extension for AirDC++.

## Resources

- [AirDC++ Web API reference](http://apidocs.airdcpp.net)
- [AirDC++ API connector documentation](https://github.com/airdcpp-web/airdcpp-apisocket-js)
- [Extension examples](https://github.com/airdcpp-web/airdcpp-extension-js/tree/master/examples)
- [airdcpp-release-validator extension](https://github.com/maksis/airdcpp-release-validator)

## Installation and usage

### Preparation

You must have [node.js](https://nodejs.org) installed. This starter project will automatically transpile your code with [babel](https://babeljs.io) to make many of the latest language features run with older version of node.js. However, installing the latest LTS version for devepment use is highly recommended (the version offered by package managers may be somewhat outdated).

- Download the [latest available release](https://github.com/airdcpp-web/airdcpp-create-extension/releases) and extract it to any location on your system
- Run `npm install` inside the root extension directory

## Developing

Extension's entry point for extension-specific code is `src/main.js`. Files inside the `dist` directory are generated automatically and should not be modified by hand.

### Running/debugging the extension

- Create a copy of ``devserver/settings.js.example`` and rename it to ``devserver/settings.js``
- Edit ``devserver/settings.js`` to contain the correct API address and user credentials

**Visual Studio Code**

The project contains debug configuration files for [Visual Studio Code](https://code.visualstudio.com) so it can be launched directly via the *Debug* panel.

**Running from terminal**

Run `npm start` to start the development server. The extension will be restarted automatically every time the source files are updated.


## Publishing extensions

You must have an account and logged in from the npm client. Please see [npm help](https://docs.npmjs.com/getting-started/publishing-npm-packages) for more information.

- Ensure that package.json contains the correct information. See the [package.json section](/#package.json) for more information.

When publishing a new package, it may make sense to test it for a while, possibly with a limited group of users, before adding it in the public extension directory. After publishing the extension, run `npm view my-package-name dist.tarball` to get the direct installation URL for the extension. Users installing the extension via the URL will still be notified about possible extension updates (assuming that the `private` property is not set).

- Build the package by running `npm run build`
- Publish it by running `npm publish`




## Additional information

### package.json

Please see https://docs.npmjs.com/files/package.json for generic field descriptions.

#### Application-specific remarks

**Required fields**

`name`

Extension name. **The name must start with `airdcpp-`.**

`description`

Extension description

`version`

Extension version

`author` (`name` field)

Author's (user)name

`main`

Script to launch by the application when the extension is started. This should generally not be changed.


**Other fields**

`private`

If this field is set to `true`, the extension can't be accidentally published to `npm`. It also causes the application not to perform update checks for such extension from the npm registry. When writing extensions that you are not going publish on npm, it's important to enable this property so that your extension won't be replaced with another extension using the same name on npm due to updates offered to the user.

`keywords`

If you want the extension to be publicly listed in application's extension catalog, this field should contain the keyword `airdcpp-extensions-public`. If you don't want the extension to be listed publicly, you should omit this keyword.

`engines`

List of scripting engines to use for launching the extension. If the `engines` field is not set, the application will attempt to use the engine `node` by default.

**airdcpp section (required)**

`apiVersion`

Supported API version

`minApiFeatureLevel`

Mininimum API feature level supported by the extension


### Dependencies

When writing extensions, you generally want to use other npm packages (such as `airdcpp-apisocket`) to provide certain functionality. 
Unlike when writing regular npm packages used by Javascript developers, AirDC++ won't perform `npm install` when the extension is installed by the user, which means that all the required dependencies must be shipped with the extension itself. Use of binary dependencies should generally be avoided due to possible portability issues.

#### Using module bundler

`airdcpp-create-extension` handles external dependencies by using a module bundler ([Webpack](https://webpack.github.io/)) to bundle all code required by the extension into a single file. This approach should work just fine for most cases, but certain npm packages targeted for server-side use may not be suitable to be used with a module bundler.


#### Using bundleDependencies

If you need to use dependencies that can't be bundled using Webpack, you might want to check out the [bundledDepencencies](https://docs.npmjs.com/files/package.json#bundleddependencies) field in package.json.

All packages listed in `dependencies` should also be included in the `bundledDepencencies` array similar to this:

```
dependencies: {
  "complex-dependency-1": "^1.0.0",
  ....
},
bundledDepencencies: [ 'complex-dependency-1', ... ],
```

You may transpile your own code to be compatible with older version of node by running `npm run babel`. This will simply just put transpiled versions of your code into `dist` folder without any bundling.

If you still want to continue using Webpack as part of your build process, it's possible to configure it to skip bundling of external dependencies (see http://jlongster.com/Backend-Apps-with-Webpack--Part-I for more information).

The downside of using bundledDependencies is increased extension installation size and (usually) large amount of files to install.

#### Keeping the extension responsive

Since extensions use WebSockets to communicate with the API, they are pinged regularly by the server (application) to ensure that the connection stays alive. The default ping timeout is 10 seconds and if a managed extension is unable to response to a ping request within that time, the extension will exit. Unresponsive extensions are also incapable of handling possible API hooks, that may cause visible delays to the user (such in cases where you have hooks for incoming/outgoing chat messages). It's thus recommended to perform possible long-running operations (such as handling of large files on disk) asynchronously so that they won't block the main thread. 

However, there are certain caveats in heavily asynchronous code as well. If a large amount of (CPU-bound) asynchronous tasks are being queued simultaneously, they will take priority over subsequently initiated actions, and once again, your main thread may be blocked for a long time. When performing heavy operations that may utilize a large number of asynchronous functions (such as recursively iterating over all shared directories on filesystem), you should be vary of the number of queued operations and possibly wait for the existing ones to complete before launching new ones. See the [scanning method of airdcpp-release-validator](https://github.com/maksis/airdcpp-release-validator/blob/master/src/Scanner.js) for an example of recursive, asynchronous directory scanner.

[build-badge]: https://img.shields.io/travis/airdcpp-web/airdcpp-create-extension/master.svg?style=flat-square
[build]: https://travis-ci.org/airdcpp-web/airdcpp-create-extension

[npm-badge]: https://img.shields.io/npm/v/airdcpp-create-extension.svg?style=flat-square
[npm]: https://www.npmjs.org/package/airdcpp-create-extension
