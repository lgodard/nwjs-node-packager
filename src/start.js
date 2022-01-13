'use strict';
const path = require('path');
const yargs = require('yargs');
const fs = require('fs-extra');

const createPackage = require('./main.js').createPackage;

const messages = require('./lib/messages');

(async() => {

    const args = yargs
        .option('params', {
            type: 'string',
            describe: 'js file containing parameters for the packaging',
        })
        .argv;

    let params_path = args.params;
    if (!params_path) {
        params_path = './params.example.js';
        messages.warning('Using default parameter file ' + path.resolve(params_path));
    }

    if (!await fs.pathExists(path.resolve(params_path))) {
        messages.error('Parameter file NOT FOUND ' + path.resolve(params_path));
        return;
    }

    const params = require(path.resolve(params_path));

    await createPackage(params);
    messages.work('\n');
})();
