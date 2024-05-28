'use strict';
const path = require('path');
const os = require('os');

const shell = require('shelljs');
const fs = require('fs-extra');

const messages = require('./messages');

const filehound = require('filehound');

async function create_win(params) {

    setAppName(params);

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

    const wxs = await explore_dir(params.target_dir, params.target_dir, params.platform.installer.wixl_relative_path);

    let features = '';
    wxs.file_ids.forEach((file_id) => {
        features += `
        <ComponentRef Id="${file_id}"/>
        `;
    });

    const wixl_template_filename = '../template/app.wxs';

    // loads nsis template
    const wixl_template = await fs.readFile(path.resolve(path.join(__dirname, wixl_template_filename)), 'utf8');

    // creates nsis
    let regexp = RegExp(/NWJS_APP_REPLACE_DIRECTORY_CONTENT/g);
    let wixl = wixl_template.replace(regexp, wxs.content);

    regexp = RegExp(/NWJS_APP_REPLACE_FEATURE/g);
    wixl = wixl.replace(regexp, features);

    const iconPath = path.resolve(path.join(params.target_dir, 'app', params.platform.installer.win_ico_filename));
    regexp = RegExp(/NWJS_APP_REPLACE_ICON/g);
    wixl = wixl.replace(regexp, params.platform.installer.wixl_relative_path ? iconPath.replace(process.cwd(), '.') : iconPath);

    regexp = RegExp(/NWJS_APP_REPLACE_VERSION/g);
    wixl = wixl.replace(regexp, params.platform.installer.app_version);

    regexp = RegExp(/NWJS_APP_REPLACE_MANUFACTURER/g);
    wixl = wixl.replace(regexp, params.platform.installer.manufacturer);

    regexp = RegExp(/NWJS_APP_REPLACE_NAME/g);
    wixl = wixl.replace(regexp, params.platform.installer.app_name);

    regexp = RegExp(/NWJS_APP_REPLACE_LANGUAGE/g);
    wixl = wixl.replace(regexp, params.platform.installer.msi_language);

    regexp = RegExp(/NWJS_APP_REPLACE_SCOPE/g);
    wixl = wixl.replace(regexp, params.platform.installer.user_install ? 'perUser' : 'perMachine');

    regexp = RegExp(/NWJS_APP_REPLACE_INSTALLFOLDER/g);
    wixl = wixl.replace(regexp, params.platform.installer.user_install ? 'LocalAppDataFolder' : 'ProgramFilesFolder');


    // save wixl
    const wixl_filename = `${params.platform.os}-${params.platform.arch}.wixl`;
    const wixl_path = path.resolve(path.join(params.output_dir), wixl_filename);
    await fs.writeFile(wixl_path, wixl, 'utf8');

    // compile wixl
    messages.work('* Create installer (msi)');

    const output_msi = path.resolve(path.join(params.output_dir), output_filename);
    const cmd = `wixl -o ${output_msi} ${wixl_path}`;
    const out_bin = shell.exec(cmd, {silent: true});
    if (out_bin.code != 0) {
        messages.error('--> ERROR ' + cmd);
        messages.error(out_bin);
    } else {
        messages.info('==> Installer available at ' + output_msi);
    }

}

async function explore_dir(dir, base_dir, wixl_relative_path) {

    const dir_id = dir.replace(base_dir, '').replace(/\//g, '_');

    const result = {};
    result.content = '';
    result.file_ids = [];

    // files
    await filehound.create()
        .path(dir)
        .depth(0)
        .find()
        .each((file) => {
            const file_name = path.basename(file);
            const file_id = dir_id ? dir_id + '_' + file_name : file_name;
            result.file_ids.push(file_id);

            let source_file;
            if (wixl_relative_path) {
                source_file = file.replace(process.cwd(), '.');
            } else {
                source_file = file;
            }

            result.content += `
                <Component Id="${file_id}" Guid="*">
                    <File Id="${file_id}" Source="${source_file}" Name="${file_name}"/>
                </Component>\n`;
        });

    // sub directories
    const promises = [];
    await filehound.create()
        .path(dir)
        .directory()
        .depth(1)
        .find()
        .then((subdirs) => {
            subdirs.forEach((subdir) => {
                const p = Promise.resolve().then(() => {
                    return explore_dir(subdir, base_dir, wixl_relative_path);
                }).then((sub_result) => {

                    const sub_dir_id = subdir.replace(base_dir + '/', '').replace(/\//g, '_');
                    const sub_dir_name = path.basename(subdir);

                    result.content += `<Directory Id="${sub_dir_id}" Name="${sub_dir_name}">\n`
                                        + sub_result.content + '</Directory>\n';

                    result.file_ids.push(...sub_result.file_ids);
                });
                promises.push(p);
            });
        });

    await Promise.all(promises);

    return result;
}

async function create_nsis(params) {

    const nsis_template_filename = '../template/app.nsi';

    // loads nsis template
    const nsis_template = await fs.readFile(path.resolve(path.join(__dirname, nsis_template_filename)), 'utf8');

    // creates nsis
    let regexp = RegExp(/NWJS_APP_REPLACE_APPNAME/g);
    let nsis = nsis_template.replace(regexp, params.platform.installer.app_name);

    // check for running
    regexp = RegExp(/NWJS_APP_DETECT_RUNNING/g);
    nsis = nsis.replace(regexp, params.platform.installer.detect_running ? 1 : 0);
    if (params.platform.installer.detect_running) {
        regexp = RegExp(/NWJS_APP_MAIN_WINDOW_TITLE/g);
        nsis = nsis.replace(regexp, params.platform.installer.main_window_title);
        regexp = RegExp(/NWJS_APP_ALREADY_RUNNING_MESSAGE/g);
        nsis = nsis.replace(regexp, params.platform.installer.already_running_message);
    }

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
    messages.work('* Create installer (exe)');
    const makensis = await import('makensis'); // dynamic import as makensis becomes an ES6 module
    const nsis_output = await makensis.compile(nsis_path);
    if (nsis_output.status != 0) {
        messages.error('nsis_output ' + JSON.stringify(nsis_output));
    } else {
        messages.info('==> Installer available at ' + path.resolve(path.join(params.output_dir), exe_name));
    }
}

async function create_osx(params) {

    setAppName(params);

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

function setAppName(params) {

    // if no app_name
    // takes the name of the deployed app (through nwjs package.json)

    if (!params.platform.installer.app_name) {
        // read dist package.json
        const package_path = path.resolve(path.join(params.target_dir, 'app', 'package.json'));
        const nwjsConfig = JSON.parse(fs.readFileSync(package_path).toString());

        // set app_name
        params.platform.installer.app_name = nwjsConfig.name;
    }
}


module.exports = {
    create_win,
    create_osx
};