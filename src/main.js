'use strict';
const path = require('path');
const yargs = require('yargs');
const fs = require('fs-extra');

const processor = require('./lib/processor');
const messages = require('./lib/messages');

async function go(params) {
    for (const platform of params.PLATFORMS) {

        const options = {...params.COMMON};
        options.platform = {...platform};
        options.target_dir = path.resolve(path.join(options.output_dir, `${options.platform.os}-${options.platform.arch}`));

        messages.section(`Building ${options.platform.os}-${options.platform.arch}`);

        /* eslint-disable-next-line no-await-in-loop */
        const success = await processor.run(options);
        if (!success) {
            messages.error('\n' + 'ERROR occured, please check above lines');
        }
    }
}

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

    await go(params);
    messages.work('\n');
})();
