'use strict';

const path = require('path');

const fs = require('fs-extra');
const filehound = require('filehound');

const utils = require('./utils');

const NJWS_LOCALES = [
    'fr',
    'en-US',
    'en-GB'
];

async function create_dist(nwjs_dir, source_dir, target_dir, platform_os) {

    // clean
    const dist_dir_exists = await fs.pathExists(path.resolve(target_dir));
    if (dist_dir_exists) {
        await utils.clean(target_dir, '');
    } else {
        await fs.ensureDir(target_dir);
    }

    // copy nwjs
    await fs.copy(nwjs_dir, target_dir);

    // remove useless locales
    if (platform_os !== 'osx') { // TODO: clean locales for osx

        const promises = [];

        const selected_locales = NJWS_LOCALES.map((locale) => {
            return locale + '*';
        });

        await filehound.create()
            .paths(path.join(target_dir, 'locales'))
            .not()
            .match(selected_locales)
            .find()
            .then((files) => {
                files.forEach((file) => {
                    promises.push([
                        fs.remove(file)
                    ]);
                });
            });
    }

    // merge source
    await fs.copy(source_dir, path.join(target_dir, 'app'));

}

module.exports = {
    create_dist
};