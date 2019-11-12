# Installation

## NPM

The recommended way of getting bluzelle-js is through the npm package manager. Simply run `npm install bluzelle` and require it in your project with `require('bluzelle');`.

The NPM release reflects the bluzelle-js master branch.

## Building from source

If you are interested in a cutting-edge build of bluzelle-js, or wish to use alternate feature branches, you will have to build from source. This process is very easy.

1. Clone the [bluzelle-js repository](https://github.com/bluzelle/bluzelle-js) and checkout your desired branch. Run `git submodule init` and `git submodule update`. If you checkout to a new branch, be sure to rerun `git submodule update`. 
2. Run `npm ci` to fetch the project's dependencies.
3. Run `npx webpack` to build the library. The bundled versions, for browser and node environments, will be found in the `lib/` directory.


## Linking from source

Once you have a build, you probably want to use it in a JavaScript project. We will show how to use `npm link` to achieve this goal.

1. In your bluzelle-js directory, run `npm link` to create a package link.
2. In your other project directory, run `npm link bluzelle`.

Now you will be able to use your custom-built version of bluzelle-js exactly the same as if you had downloaded it off NPM.


## Running unit tests

`npm run test-node`


## Running integration tests

This repository contains a small set of tests for development purposes. A more comprehensive set of tests may be found at https://github.com/bluzelle/qa. 

The test suite can be run in both node and browser.

1. Build the library
2. Get a swarm to test against. See "Deploying a local swarm" below for instructions on the tools included in this repository.
3. Configure the swarm entry point. Modify `./src/test/connection_config.json` with your preferred entry url and contract address.
4. `npm run test-node`
5. `npm run test-browser`


{% hint style="info" %}
`npm run test-browser` uses the `open` command to open the webpage `./test-browser/mocha.html` in a browser. If you are not on Mac, you may navigate to and open this file manually.
{% endhint %}



## Deploying a local swarm

1. Build the library
2. Build `./swarmDB` (See https://github.com/bluzelle/swarmDB)
3. Run [Ganache GUI](https://www.trufflesuite.com/ganache)
4. Update `./scripts/deploy-ethereum.js:6` to one of the addresses in Ganache GUI.
5. `cd scripts`
6. `./run-swarms.rb 3`. This command will spawn several nodes and print a highlighted contract address.


{% hint style="info" %}
This process has not been verified to work on linux.
{% endhint %}
