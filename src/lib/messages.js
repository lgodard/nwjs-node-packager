'use strict';

const chalk = require('chalk');

const chalk_error = chalk.redBright;
const chalk_warning = chalk.yellowBright;
const chalk_info = chalk.green;
const chalk_infoTitle = chalk.blueBright;
const chalk_work = chalk.white;
const chalk_section = chalk.cyanBright;

const ANSI_CODE = {
    white: '\u001b[37m',
    reset: '\u001b[0m'
};

function error(message) {
    displayMessage(message, chalk_error);
}
function warning(message) {
    displayMessage(message, chalk_warning);
}
function info(message) {
    displayMessage(message, chalk_info);
}
function title(message) {
    displayMessage('\n' + message + '\n', chalk_infoTitle);
}
function work(message) {
    displayMessage(message, chalk_work);
}
function section(message) {
    const section_message = '\n*******************\n' + message + '\n*******************';
    displayMessage(section_message, chalk_section);
}

function displayMessage(message, colorer) {
    console.log(colorer(message));
}

module.exports = {
    ANSI_CODE,
    error,
    warning,
    info,
    title,
    work,
    section
};