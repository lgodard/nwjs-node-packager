'use strict';
const path = require('path');

const processor = require('./lib/processor');
const messages = require('./lib/messages');

async function createPackage(params) {
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

module.exports = {
    createPackage
};
