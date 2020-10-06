'use strict';

const filehound = require('filehound');
const fs = require('fs-extra');

async function clean(target_dir, basename) {

    const promises = [];

    await filehound.create()
        .paths(target_dir)
        .match(`${basename}*`)
        .depth(0)
        .find()
        .then((files) => {
            files.forEach((file) => {
                promises.push([
                    fs.remove(file)
                ]);
            });
        });

    await filehound.create()
        .paths(target_dir)
        .match(`${basename}*`)
        .directory()
        .find()
        .then((dirs) => {
            dirs.forEach((dir) => {
                promises.push([
                    fs.remove(dir)
                ]);
            });
        });

    await Promise.all(promises);
}

module.exports = {
    clean
};