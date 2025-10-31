'use strict';

const path = require('path');

const fs = require('fs-extra');
const shell = require('shelljs');
const messages = require('./messages');

async function setBin(params, nwjs_sdk_dir) {
    // generate bin file
    messages.work('* Generate bin file');

    // sdk command line
    let nwjc = path.resolve(path.join(nwjs_sdk_dir, 'nwjc')); //suitable for linux

    if (params.platform.os == 'win') {
        if (params.platform.arch == 'x64') {
            nwjc = `wine64 ${nwjc}.exe`;
        } else if (params.platform.arch == 'ia32') {
            nwjc = `wine ${nwjc}.exe`;
        }
    } else if (params.platform.os == 'osx') {
        messages.warning('\t--> ABORT not availaible for OSX');
        return;
    }

    const app_file_js = path.join(params.target_dir, 'app', params.built_script);
    const app_file_bin = path.join(params.target_dir, 'app', params.built_script + '.bin');

    const cmd = `${nwjc} ${app_file_js} ${app_file_bin}`;

    const out_bin = shell.exec(cmd, {silent: true});
    if (out_bin.code != 0) {
        messages.error('--> ERROR ' + cmd);
        messages.error(out_bin);
        return;
    }

    // remove script call
    messages.work('* Change script call');

    const html_file = path.join(params.target_dir, 'app', params.built_html);
    const html_content = await fs.readFile(html_file, 'utf8');

    const regexp = new RegExp(`<script.*src="${params.built_script}".*><\/script>`, 'g');
    let new_content = html_content.replace(regexp, '');

    const html_script_bin_loader = `<script>require('nw.gui').Window.get().evalNWBin(null, './${params.built_script}.bin');</script>`;
    if (!new_content.includes(html_script_bin_loader)) {
        new_content = new_content.replace('</body>', html_script_bin_loader + '</body>');
    }

    await fs.writeFile(html_file, new_content, 'utf8');

    // remove file
    messages.work('* Delete old script file');
    await fs.remove(app_file_js);

}

async function createBinOsx(params, nwjs_sdk_dir) {

    const silent = true;

    // prepare
    const template_command = `ssh ${params.platform.protect.ssh} 'NWJS_OSX_CMD'`;

    // has working directory
    let remote_command = 'ls temp_nwjs_work';
    let cmd = template_command.replace('NWJS_OSX_CMD', remote_command);

    let need_create_wrk_osx_dir = true;
    let out_ssh = shell.exec(cmd, {silent});

    if (out_ssh.code == 0) {
        remote_command = `ls temp_nwjs_work/${path.basename(nwjs_sdk_dir)}`;
        cmd = template_command.replace('NWJS_OSX_CMD', remote_command);
        out_ssh = shell.exec(cmd, {silent});
        if (out_ssh.code == 0) {
            need_create_wrk_osx_dir = false;
        }
    }

    // create working directory if needed
    messages.work('* OSX ssh copy elements (may take some time)');

    if (need_create_wrk_osx_dir) {

        remote_command = 'mkdir temp_nwjs_work';
        cmd = template_command.replace('NWJS_OSX_CMD', remote_command);
        out_ssh = shell.exec(cmd, {silent});

        cmd = `scp ${nwjs_sdk_dir}.zip ${params.platform.protect.ssh}:temp_nwjs_work/`;
        out_ssh = shell.exec(cmd, {silent});

        remote_command = `cd temp_nwjs_work && unzip ${path.basename(nwjs_sdk_dir)}.zip`;
        cmd = template_command.replace('NWJS_OSX_CMD', remote_command);
        out_ssh = shell.exec(cmd, {silent});

        messages.work('\t--> done ' + path.basename(nwjs_sdk_dir));

    } else {
        messages.work('\t--> skip existing');
    }

    // upload & transform

    messages.work('* OSX ssh create binary snapshot');

    // clean previous
    remote_command = 'rm temp_nwjs_work/app.*';
    cmd = template_command.replace('NWJS_OSX_CMD', remote_command);
    out_ssh = shell.exec(cmd, {silent});

    // copy app.js
    const target_app_osx = path.join(path.resolve(params.target_dir), params.platform.installer.app_name + '.app', 'Contents', 'Resources', 'app.nw');
    const app_file_js = path.join(target_app_osx, params.built_script);
    cmd = `scp ${app_file_js} ${params.platform.protect.ssh}:temp_nwjs_work/${params.built_script}`;
    out_ssh = shell.exec(cmd, {silent});

    // transform to app.bin
    remote_command = `cd temp_nwjs_work && ${path.basename(nwjs_sdk_dir)}/nwjc ${params.built_script} ${params.built_script}.bin`;
    cmd = template_command.replace('NWJS_OSX_CMD', remote_command);
    out_ssh = shell.exec(cmd, {silent});

    // get back app.bin
    cmd = `scp ${params.platform.protect.ssh}:temp_nwjs_work/${params.built_script}.bin ${target_app_osx}/${params.built_script}.bin`;
    out_ssh = shell.exec(cmd, {silent});

    await setBinOsx(params);
}

async function importBinOsx(params) {
    // copy
    const target_app_osx = path.join(path.resolve(params.target_dir), params.platform.installer.app_name + '.app', 'Contents', 'Resources', 'app.nw');
    const target_file_bin = path.join(target_app_osx, params.built_script + '.bin');
    await fs.copy(path.resolve(params.platform.protect.bin_path), target_file_bin);

    // set
    await setBinOsx(params);
}

async function setBinOsx(params) {

    const target_app_osx = path.join(path.resolve(params.target_dir), params.platform.installer.app_name + '.app', 'Contents', 'Resources', 'app.nw');
    const app_file_js = path.join(target_app_osx, params.built_script);

    // remove script call
    messages.work('* Change script call');

    const html_file = path.join(target_app_osx, params.built_html);

    const initial_loading_script = `<script type="text/javascript" src="${params.built_script}"></script>`;
    const html_script_bin_loader = `<script>require('nw.gui').Window.get().evalNWBin(null, './${params.built_script}.bin');</script>`;

    const html_content = await fs.readFile(html_file, 'utf8');
    let new_content = html_content.replace(initial_loading_script, '');

    if (!new_content.includes(html_script_bin_loader)) {
        new_content = new_content.replace('</body>', html_script_bin_loader + '</body>');
    }

    await fs.writeFile(html_file, new_content, 'utf8');

    // remove file
    messages.work('* Delete old script file');
    await fs.remove(app_file_js);

}

module.exports = {
    setBin,
    createBinOsx,
    importBinOsx,
};