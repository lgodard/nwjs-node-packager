'use strict';
const path = require('path');
const os = require('os');

const shell = require('shelljs');
const fs = require('fs-extra');
const makensis = require('makensis');

const messages = require('./messages');

const util = require('util');
const msi_packager = require('msi-packager');
const createMsi = util.promisify(msi_packager);

async function create_win(params) {

    const promises = [];

    if (params.platform.installer.type) {
        if (params.platform.installer.type.includes('exe')) {
            const p = create_nsis(params);
            promises.push(p);
        }
        if (params.platform.installer.type.includes('msi')) {
            const p = create_msi(params);
            promises.push(p);
        }
    } else {
        const p = create_nsis(params);
        promises.push(p);
    }

    await Promise.all(promises);
}

async function create_msi(params) {

    const output_filename = `Setup-${params.platform.installer.app_name}-${params.platform.installer.app_version}_${params.platform.arch}.msi`;

    const msi_params = {
        // required
        source: params.target_dir,
        output: path.resolve(path.join(params.output_dir), output_filename),
        name: params.platform.installer.app_name,
        upgradeCode: params.platform.installer.upgradeCode,
        version: params.platform.installer.app_version,
        manufacturer: params.platform.installer.manufacturer,
        iconPath: path.resolve(path.join(params.target_dir), params.platform.installer.win_ico_filename),
        executable: 'nw.exe app',

        // optional
        description: params.platform.installer.description,
        arch: params.platform.arch,
        localInstall: params.platform.installer.user_install
    };

    //await createMsi(msi_params);
    return Promise.resolve().then(() => {
        return msi_packager(msi_params, (err) => {
            if (err) {
                throw err;
            }
            console.log('Outputed to ' + msi_params.output);
        });
    });

}

async function create_nsis(params) {

    const nsis_template_filename = '../template/app.nsi';

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

    regexp = RegExp(/NWJS_APP_REPLACE_INC_FILE_ICO/g);
    nsis = nsis.replace(regexp, params.platform.installer.win_ico_filename);

    regexp = RegExp(/NWJS_APP_REPLACE_SOURCE_DIRECTORY/g);
    nsis = nsis.replace(regexp, params.target_dir);

    const user_level = params.platform.installer.user_install ? 'RequestExecutionLevel user' : '';
    regexp = RegExp(/NWJS_APP_REPLACE_USER_LEVEL/g);
    nsis = nsis.replace(regexp, user_level);

    const registry_target = params.platform.installer.user_install ? 'HKCU' : 'HKLM';
    regexp = RegExp(/NWJS_APP_REPLACE_REGISTRY/g);
    nsis = nsis.replace(regexp, registry_target);

    const target_win_dir = params.platform.installer.user_install ? '$LOCALAPPDATA' : '$APPDATA';
    regexp = RegExp(/NWJS_APP_REPLACE_TARGET_WIN_DIR/g);
    nsis = nsis.replace(regexp, target_win_dir);

    const language = params.platform.installer.language || 'English';
    regexp = RegExp(/NWJS_APP_REPLACE_INSTALL_LANGUAGE/g);
    nsis = nsis.replace(regexp, language);

    // save nsis
    const nsis_filename = `${params.platform.os}-${params.platform.arch}.nsi`;
    const nsis_path = path.resolve(path.join(params.output_dir), nsis_filename);
    await fs.writeFile(nsis_path, nsis, 'utf8');

    // compile nsis
    messages.work('* Create installer');
    const nsis_output = await makensis.compile(nsis_path);
    if (nsis_output.status != 0) {
        messages.error('nsis_output ' + JSON.stringify(nsis_output));
    } else {
        messages.info('==> Installer available at ' + path.resolve(path.join(params.output_dir), exe_name));
    }
}

async function create_osx(params) {

    const script_template_filename = '../template/create_dmg.sh';

    // loads script template
    const script_template = await fs.readFile(path.resolve(path.join(__dirname, script_template_filename)), 'utf8');

    // creates script
    const userInfo = os.userInfo();
    let regexp = RegExp(/NWJS_DMG_REPLACE_CURRENT_USER/g);
    let script = script_template.replace(regexp, userInfo.username);

    const out_size = shell.exec(`du -sb ${params.target_dir}`, {silent: true});
    let size = out_size.split('\t')[0];
    size = Number(size) / 1024 / 1024; // TO MiB
    size = 1.05 * size; // TODO: needed security
    size = Math.ceil(size);
    regexp = RegExp(/NWJS_DMG_REPLACE_SOURCE_SIZE/g);
    script = script.replace(regexp, size);

    const dmg_name = `${params.platform.installer.app_name}-${params.platform.installer.app_version}.dmg`;
    regexp = RegExp(/NWJS_DMG_REPLACE_FILENAME/g);
    script = script.replace(regexp, dmg_name);

    const volume_name = `${params.platform.installer.app_name} ${params.platform.installer.app_version}`;
    regexp = RegExp(/NWJS_DMG_REPLACE_VOLUME_NAME/g);
    script = script.replace(regexp, volume_name);

    const dmg_target_path = path.resolve(path.join(params.output_dir), dmg_name);
    regexp = RegExp(/NWJS_DMG_REPLACE_TARGET/g);
    script = script.replace(regexp, dmg_target_path);

    regexp = RegExp(/NWJS_DMG_REPLACE_SOURCE_DIRECTORY/g);
    script = script.replace(regexp, params.target_dir);

    // save script
    const script_filename = `${params.platform.os}-${params.platform.arch}-${params.platform.installer.app_version}.sh`;
    const script_path = path.resolve(path.join(params.output_dir), script_filename);
    await fs.writeFile(script_path, script, 'utf8');

    // execute script
    messages.work('* Create installer (need sudo)');
    shell.exec(`chmod u+x ${script_path}`, {silent: true});
    const result = shell.exec(`sudo ${script_path}`, {silent: true, fatal: true});
    if (result.code != 0) {
        messages.error('\n--> ABORT dmg script error \n' + JSON.stringify(result));
    } else {
        messages.info('\n==> Installer available at ' + path.resolve(path.join(params.output_dir), dmg_name));
    }
}


module.exports = {
    create_win,
    create_osx
};