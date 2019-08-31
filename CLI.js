#! /usr/bin/env node

const fs = require('fs');
const ml = require('./Multiline');
// const Formatter = require('./Docx/Formatter');
const Validator = require('./Docx/Validator');
const Differ = require('./Docx/Differ');

const TYPE = [ '-t', '--type' ];
const OUTPUT = [ '-o', '--output' ];
const VERBOSE = [ '-v', '--verbose' ];
const HELP = [ '-h', '--help' ];

const ACTION = {
    DEBUG: 'debug',
    VALIDATE: 'validate',
    DIFF: 'diff',
};

const args = process.argv.slice(2);

if (args.length === 0)
    return console.error(`One of the following .docx actions must be provided:\n${Object.values(ACTION).map(action => `- ${action}`).join('\n')}`);

const isDocx = filePath => {
    if (!fs.existsSync(filePath))
        return console.error(`${filePath} is not a file or directory.`);

    const file = fs.statSync(filePath);
    if (!file.isFile())
        return console.error(`${filePath} is not a file.`);

    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    if (fileExtension.toLowerCase() !== '.docx')
        return console.error(`${filePath} is not a .docx`);

    return true;
};

const action = args.shift();
switch (action) {
    case ACTION.DEBUG:
        return console.error(`${action} is an unimplemented .docx action.`);
        // Formatter
    case ACTION.VALIDATE: {
        if (args.find(arg => HELP.includes(arg)))
            return console.error(ml`
                -v, --verbose   | Providing this argument will log each step of the validation
            `);

        if (args.length === 0)
            return console.error('A path to the file to validate must be provided.');

        const filePath = args.shift();

        let verbose;
        while (args.length > 0) {
            const arg = args.shift();
            if (VERBOSE.includes(arg)) {
                verbose = true;
            } else {
                return console.error(`${arg} is an unknown argument.`);
            }
        }

        if (!isDocx(filePath))
            return;

        Validator.validate(fs.readFileSync(filePath), { verbose })
            .then(errors => errors.length === 0 ?
                console.info('No errors found.') :
                errors.forEach(Validator.log));
        break;
    }
    case ACTION.DIFF: {
        if (args.find(arg => HELP.includes(arg)))
            return console.error(ml`
                -t, --type      | Default diff type is 'directory' but may also diff each 'file'
                -o, --output    | Default output is 'console' but may also be output as 'json'
                -v, --verbose   | Providing this argument will log each step of the diff
            `);

        if (args.length < 2)
            return console.error('Two .docx file paths are required as arguments.');

        const oldFilePath = args.shift();
        const newFilePath = args.shift();

        let type, output, verbose;
        while (args.length > 0) {
            const arg = args.shift();

            if (TYPE.includes(arg)) {
                type = args.shift();
            } else if (OUTPUT.includes(arg)) {
                output = args.shift();
            } else if (VERBOSE.includes(arg)) {
                verbose = true;
            } else {
                return console.error(`${arg} is an unknown argument.`);
            }
        }

        const filePaths = [ oldFilePath, newFilePath ];

        if (!filePaths.every(isDocx))
            return;

        const [ oldFile, newFile ] = filePaths
            .map(filePath => fs.readFileSync(filePath));

        Differ.diff(oldFile, newFile, { type, output, verbose });
        break;
    }
    default:
        return console.error(`${action} is an unknown .docx action.`);
}