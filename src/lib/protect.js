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

    // remove file
    messages.work('* delete script file');
    fs.remove(app_file_js);

    const html_file = path.join(params.target_dir, 'app', params.built_html);

    // remove script call
    messages.work('* Change script call');

    const initial_loading_script = `<script type="text/javascript" src="${params.built_script}"></script>`;
    const html_script_bin_loader = `<script>require('nw.gui').Window.get().evalNWBin(null, './${params.built_script}.bin');</script>`;

    const html_content = await fs.readFile(html_file, 'utf8');
    let new_content = html_content.replace(initial_loading_script, '');

    if (!new_content.includes(html_script_bin_loader)) {
        new_content = new_content.replace('</body>', html_script_bin_loader + '</body>');
    }

    await fs.writeFile(html_file, new_content, 'utf8');

}

module.exports = {
    setBin
};