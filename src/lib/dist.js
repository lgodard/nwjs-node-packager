'use strict';

const path = require('path');

const fs = require('fs-extra');
const filehound = require('filehound');

const utils = require('./utils');

async function create_dist(nwjs_dir, params) {

    // clean
    const dist_dir_exists = await fs.pathExists(path.resolve(params.target_dir));

    if (dist_dir_exists) {
        await utils.clean(path.resolve(params.target_dir));
    } else {
        await fs.ensureDir(path.resolve(params.target_dir));
    }

    // copy nwjs
    await fs.copy(nwjs_dir, path.resolve(params.target_dir));

    // remove useless locales

    let promises = [];

    if (!params.nwjs_locales) {
        params.nwjs_locales = [];
    }

    if (params.platform.os !== 'osx') {

        const selected_locales = params.nwjs_locales.map((locale) => {
            return locale + '*';
        });

        await filehound.create()
            .paths(path.join(path.resolve(params.target_dir), 'locales'))
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

        const selected_locales = params.nwjs_locales.map((locale) => {
            return locale.replace('-', '_') + '.lproj';
        });
        selected_locales.push('base.lproj'); // we keep this anyway

        const lproj_paths = [
            path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Resources'),
            path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Frameworks', 'nwjs Framework.framework', 'Versions'),
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
    const target_app = path.join(path.resolve(params.target_dir), 'app');
    await fs.copy(params.source_dir, target_app);

    // add external files
    promises = [];
    if (params.platform.external_files) {
        params.platform.external_files.forEach((external) => {
            const source = external.source_filepath;
            const filename = path.basename(source);
            let target;
            if (!external.target_filepath || external.target_filepath.trim().length === 0) {
                target = path.join(path.resolve(params.target_dir), filename);
            } else {
                target = path.join(path.resolve(params.target_dir), external.target_filepath);
            }
            promises.push(fs.copy(source, target));
        });
        await Promise.all(promises);
    }

    if (params.platform.os == 'osx') {

        const target_app_osx = path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Resources', 'app.nw');
        await fs.move(target_app, target_app_osx);

        // changes according to https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#mac-os-x

        const old_icon = path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Resources', 'app.nw', params.platform.installer.osx_ico_filename);
        const new_icon = path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Resources', 'app.icns');
        await fs.move(old_icon, new_icon, {overwrite: true});

        // plist
        const plist_path = path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'Info.plist');
        let plist_content = await fs.readFile(plist_path, 'utf8');
        const regexp = RegExp(/<string>nwjs<\/string>/g);
        plist_content = plist_content.replace(regexp, `<string>${params.platform.installer.app_name}</string>`);
        await fs.writeFile(plist_path, plist_content, 'utf8');

        // app
        const app_path = path.join(path.resolve(params.target_dir), 'nwjs.app', 'Contents', 'MacOS');
        const app_src = path.join(app_path, 'nwjs');
        const app_target = path.join(app_path, params.platform.installer.app_name);
        await fs.move(app_src, app_target);

        const root_src_path = path.join(path.resolve(params.target_dir), 'nwjs.app');
        const root_target_path = path.join(path.resolve(params.target_dir), params.platform.installer.app_name + '.app');
        await fs.move(root_src_path, root_target_path);

    }

}

module.exports = {
    create_dist
};