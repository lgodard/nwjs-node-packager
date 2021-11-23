'use strict';

const path = require('path');

const axios = require('axios');
const fs = require('fs-extra');
const decompress = require('decompress');
const ProgressBar = require('progress');

const utils = require('./utils');
const messages = require('./messages');

const NWJS_BIN_EXT = {
    linux: 'tar.gz',
    win: 'zip',
    osx: 'zip'
};

function getNwjs(params) {
//function getNwjs(source_url, plateform, target_dir, force) {
//params.nwjs_url, params.platform, params.working_dir, params.force_nwjs_download
    // build name
    // nwjs-v0.45.4-linux-x64.tar.gz
    const filename = `nwjs-v${params.nwjs_version}-${params.platform.os}-${params.platform.arch}`;
    const url = `${params.nwjs_url}/v${params.nwjs_version}/${filename}.${NWJS_BIN_EXT[params.platform.os]}`;

    return getNwjsBinaries(url, filename, params);
}

function getNwjsSdk(params) {
//function getNwjsSdk(source_url, plateform, target_dir, force) {

    // build name + sdk
    const filename = `nwjs-sdk-v${params.nwjs_version}-${params.platform.os}-${params.platform.arch}`;
    const url = `${params.nwjs_url}/v${params.nwjs_version}/${filename}.${NWJS_BIN_EXT[params.platform.os]}`;

    return getNwjsBinaries(url, filename, params);
}

async function getNwjsBinaries(nwjs_url, filename, params) {

    const ext = NWJS_BIN_EXT[params.platform.os];
    const target_dir = params.working_dir;
    const force = params.force_nwjs_download;

    if (force) {
        await utils.clean(target_dir, filename);
    }

    const target_filename = `${path.join(target_dir, filename)}.${ext}`;

    // download
    messages.work('* Downloading ' + nwjs_url);

    const target_exists = await fs.pathExists(target_filename);

    if (!target_exists) {
        await progressDownload(nwjs_url, target_filename);
        messages.work('\t--> done');
    } else {
        messages.work('\t--> skip existing');
    }

    // expand archive

    messages.work('* Expand archive ' + filename);

    const expanded_nwjs_dir = path.join(target_dir, filename);
    const expanded_target_exists = await fs.pathExists(expanded_nwjs_dir);
    if (!expanded_target_exists) {
        await decompress(target_filename, target_dir);
        messages.work('\t--> done');
    } else {
        messages.work('\t--> skip existing');
    }

    return expanded_nwjs_dir;
}

function progressDownload(url, target_filename) {
    // Thanks to https://futurestud.io/tutorials/axios-download-progress-in-node-js

    return new Promise((resolve, reject) => {

        return axios({url, method: 'GET', responseType: 'stream'})
            .then((response) => {

                const data = response.data;
                const headers = response.headers;

                const totalLength = headers['content-length'];

                const progressBar = new ProgressBar(`${messages.ANSI_CODE.white}\t--> downloading [:bar] :percent :etas${messages.ANSI_CODE.reset}`, {
                    width: 40,
                    complete: '=',
                    incomplete: ' ',
                    renderThrottle: 500,
                    total: parseInt(totalLength)
                });

                const writer = fs.createWriteStream(target_filename);

                data.on('data', (chunk) => progressBar.tick(chunk.length));
                data.pipe(writer);

                writer.on('finish', () => {
                    resolve(true);
                }); // not sure why you want to pass a boolean
                writer.on('error', reject); // don't forget this!

            });
    });
}

module.exports = {
    getNwjs,
    getNwjsSdk
};
