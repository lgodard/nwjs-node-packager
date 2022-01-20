'use strict';

const path = require('path');

const fs = require('fs-extra');
const shell = require('shelljs');

const messages = require('./messages');

const downloader = require('./downloader');
const dist = require('./dist');
const protect = require('./protect');
const installer = require('./installer');

async function run(params) {

    // ensure prequisites

    fs.ensureDirSync(params.working_dir);

    let abort = false;

    if (params.protect) {
        // wine is used for source protection
        if (params.platform.os == 'win') {
            if (params.platform.arch == 'x64') {
                const out_wine = shell.exec('wine64 --help', {silent: true});
                if (out_wine.code != 0) {
                    abort = true;
                    messages.error('wine64 is required for source protection');
                }
            } else if (params.platform.arch == 'ia32') {
                const out_wine = shell.exec('wine --help', {silent: true});
                if (out_wine.code != 0) {
                    abort = true;
                    messages.error('wine is required for source protection');
                }
            } else {
                abort = true;
                messages.error('Unknown arch', params.platform.os);
            }
        } else if (params.platform.os == 'osx') {
            abort = true;
            messages.error('Source protection not availaible for OSX');
        }
    }

    const source_dir_exists = await fs.pathExists(path.resolve(params.source_dir));
    if (!source_dir_exists) {
        messages.error('Source directory does not exist', path.resolve(params.source_dir));
        abort = true;
    }

    // check nsis linux package for windows installer cross-building
    if (params.platform.os == 'win') {
        if (params.installer) {

            let check_nsis = false;
            let check_wixl = false;

            if (!params.installer.type || params.installer.type.includes('exe')) {
                check_nsis = true;
            }
            if (params.installer.type || params.installer.type.includes('msi')) {
                check_wixl = true;
            }

            if (check_nsis) {
                const cmd = 'dpkg -l nsis';
                const out_bin = shell.exec(cmd, {silent: true});
                if (out_bin.code != 0) {
                    messages.error('--> ERROR ' + cmd);
                    messages.error(out_bin);
                    abort = true;
                } else {
                    if (!out_bin.stdout.includes('nsis')) {
                        messages.error('"nsis" linux package must be present for windows installer cross-building');
                        abort = true;
                    }
                }
            }

            if (check_wixl) {
                const cmd = 'dpkg -l wixl';
                const out_bin = shell.exec(cmd, {silent: true});
                if (out_bin.code != 0) {
                    messages.error('--> ERROR ' + cmd);
                    messages.error(out_bin);
                    abort = true;
                } else {
                    if (!out_bin.stdout.includes('nsis')) {
                        messages.error('"wixl" linux package must be present for MSI windows installer cross-building');
                        abort = true;
                    }
                }
            }

        }
    }

    // check hfsprogs fro osx
    if (params.platform.os == 'osx') {
        if (params.installer) {
            const cmd = 'dpkg -l hfsprogs';
            const out_bin = shell.exec(cmd, {silent: true});
            if (out_bin.code != 0) {
                messages.error('--> ERROR ' + cmd);
                messages.error(out_bin);
                abort = true;
            } else {
                if (!out_bin.stdout.includes('hfsprogs')) {
                    messages.error('"hfsprogs" linux package must be present for osx installer cross-building');
                    abort = true;
                }
            }
        }
    }

    if (abort) {
        messages.error('ABORT');
        return false;
    }

    // download nwjs binaries

    messages.title('[Get NWJS]');

    const nwjs_dir = await downloader.getNwjs(params);

    messages.info('==> NJWS binaries available at ' + path.resolve(nwjs_dir));


    // merge app source & nwjs binaries
    messages.title('[Create distribuable app]');

    await dist.create_dist(nwjs_dir, params);

    messages.info('==> Application available at ' + params.target_dir);

    // make V8 snapshot for protection (need sdk)
    if (params.protect_script) {

        messages.title('[Protect source with V8 snapshot]');

        if (params.platform.os == 'osx') {
            if (params.platform.protect) {
                if (params.platform.protect.ssh) {
                    const nwjs_sdk_dir = await downloader.getNwjsSdk(params);
                    await protect.createBinOsx(params, nwjs_sdk_dir);
                } else if (params.platform.protect.bin_path) {
                    await protect.importBinOsx(params);
                } else {
                    messages.warning('\t--> ABORT missing platform parameters');
                }
            }
        } else {
            const nwjs_sdk_dir = await downloader.getNwjsSdk(params);
            await protect.setBin(params, nwjs_sdk_dir);
            messages.info('==> Application now uses V8 snapshot');
        }
    }

    // create installer
    if (params.platform.installer) {

        messages.title('[Installer]');

        /*
        if (params.platform.os != 'win') {
            messages.error('Only available for windows platform');
        } else {
            // installer
            await installer.create(params);
        }
         */

        if (params.platform.os == 'win') {
            await installer.create_win(params);
        } else if (params.platform.os == 'osx') {
            await installer.create_osx(params);
        } else {
            messages.error('Installer not available for the plateform ' + params.platform.os);
        }

    }

    return true;

}

module.exports = {
    run
};