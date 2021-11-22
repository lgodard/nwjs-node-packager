'use strict';

const path = require('path');

const fs = require('fs-extra');
const filehound = require('filehound');

const utils = require('./utils');

async function create_dist(nwjs_dir, source_dir, target_dir, platform_os, nwjs_locales) {

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

    const promises = [];

    if (!nwjs_locales) {
        nwjs_locales = [];
    }

    if (platform_os !== 'osx') {

        const selected_locales = nwjs_locales.map((locale) => {
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

    } else {

        const selected_locales = nwjs_locales.map((locale) => {
            return locale.replace('-', '_') + '.lproj';
        });
        selected_locales.push('base.lproj'); // we keep this anyway

        const lproj_paths = [
            path.join(target_dir, 'nwjs.app', 'Contents', 'Resources'),
            path.join(target_dir, 'nwjs.app', 'Contents', 'Frameworks', 'nwjs Framework.framework', 'Versions'),
        ];

        await filehound.create()
            .paths(lproj_paths)
            .directory()
            .not()
            .match(selected_locales)
            .find()
            .then((files) => {
                files.forEach((file) => {
                    if (file.endsWith('proj')) {
                        promises.push(
                            fs.remove(file)
                        );
                    }
                });
            });
    }

    await Promise.all(promises);

    // merge source
    await fs.copy(source_dir, path.join(target_dir, 'app'));

}

module.exports = {
    create_dist
};