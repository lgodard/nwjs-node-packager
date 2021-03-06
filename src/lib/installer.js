'use strict';
const path = require('path');

const fs = require('fs-extra');
const makensis = require('makensis');

const messages = require('./messages');

async function create(params) {

    const nsis_template_filename = params.platform.installer.user_install ? '../template/app_user.nsi' : '../template/app.nsi';

    // loads nsis template
    const nsis_template = await fs.readFile(path.resolve(path.join(__dirname, nsis_template_filename)), 'utf8');

    // creates nsis
    let regexp = RegExp(/NWJS_APP_REPLACE_APPNAME/g);
    let nsis = nsis_template.replace(regexp, params.platform.installer.app_name);

    regexp = RegExp(/NWJS_APP_REPLACE_VERSION/g);
    nsis = nsis.replace(regexp, params.platform.installer.app_version);

    regexp = RegExp(/NWJS_APP_REPLACE_DESCRIPTION/g);
    nsis = nsis.replace(regexp, params.platform.installer.description);

    regexp = RegExp(/NWJS_APP_REPLACE_LICENSE/g);
    nsis = nsis.replace(regexp, params.platform.installer.license);

    regexp = RegExp(/NWJS_APP_REPLACE_EXE_NAME/g);
    const exe_name = `Setup-${params.platform.installer.app_name}-${params.platform.installer.app_version}_${params.platform.arch}.exe`;
    nsis = nsis.replace(regexp, exe_name);

    regexp = RegExp(/NWJS_APP_REPLACE_ICO_FILE_NAME/g);
    nsis = nsis.replace(regexp, path.basename(params.platform.installer.win_ico_path));

    regexp = RegExp(/NWJS_APP_REPLACE_INC_FILE_ICO/g);
    nsis = nsis.replace(regexp, params.platform.installer.win_ico_path);

    regexp = RegExp(/NWJS_APP_SOURCE_DIRECTORY/g);
    nsis = nsis.replace(regexp, params.target_dir);

    // save nsis
    const nsis_filename = `${params.platform.os}-${params.platform.arch}.nsi`;
    const nsis_path = path.resolve(path.join(params.output_dir), nsis_filename);
    await fs.writeFile(nsis_path, nsis, 'utf8');

    // compile nsis
    messages.work('* Create installer');
    const nsis_output = await makensis.compile(nsis_path);
    if (nsis_output.status != 0) {
        messages.error('nsis_output ' + nsis_output);
    } else {
        messages.info('==> Installer available at ' + path.resolve(path.join(params.output_dir), exe_name));
    }
}

module.exports = {
    create
};