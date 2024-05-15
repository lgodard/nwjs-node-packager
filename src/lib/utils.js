'use strict';

const shell = require('shelljs');
const messages = require('./messages');

function clean(target_dir) {

    const cmd = `rm -rf ${target_dir}/*`;
    const out_rm = shell.exec(cmd, {silent: true});
    if (out_rm.code != 0) {
        messages.error('--> ERROR ' + cmd);
        messages.error(out_rm);
    }

}

function unzip(zip_filepath, target_dir) {

    const cmd = `unzip ${zip_filepath} -d ${target_dir}`;
    const out_rm = shell.exec(cmd, {silent: true});
    if (out_rm.code != 0) {
        messages.error('--> ERROR ' + cmd);
        messages.error(out_rm);
    }
}

module.exports = {
    clean,
    unzip
};