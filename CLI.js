#! /usr/bin/env node

const fs = require('fs');
const { print } = require('./Utility');
const { TYPE: { ERROR } } = print;
const ml = require('./Multiline');
const Debugger = require('./Docx/Debugger');
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
    return print(`One of the following .docx actions must be provided:\n${Object.values(ACTION).map(action => `- ${action}`).join('\n')}`, { type: ERROR });

const isDocx = filePath => {
    if (!fs.existsSync(filePath))
        return print(`${filePath} is not a file or directory.`, { type: ERROR });

    const file = fs.statSync(filePath);
    if (!file.isFile())
        return print(`${filePath} is not a file.`, { type: ERROR });

    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    if (fileExtension.toLowerCase() !== '.docx')
        return print(`${filePath} is not a .docx`, { type: ERROR });

    return true;
};

const action = args.shift();
switch (action) {
    case ACTION.DEBUG: {
        if (args.find(arg => HELP.includes(arg)))
            return print(ml`
                -v, --verbose   | Providing this argument will log each step
            `, { type: ERROR });

        if (args.length === 0)
            return print('A path to the file to debug must be provided.', { type: ERROR });

        const filePath = args.shift();

        let verbose;
        while (args.length > 0) {
            const arg = args.shift();
            if (VERBOSE.includes(arg)) {
                verbose = true;
            } else {
                return print(`${arg} is an unknown argument.`, { type: ERROR });
            }
        }

        if (!isDocx(filePath))
            return;

        Debugger.debug(filePath, { verbose });
        break;
    }
    case ACTION.VALIDATE: {
        if (args.find(arg => HELP.includes(arg)))
            return print(ml`
                -v, --verbose   | Providing this argument will log each step of the validation
            `, { type: ERROR });

        if (args.length === 0)
            return print('A path to the file to validate must be provided.', { type: ERROR });

        const filePath = args.shift();

        let verbose;
        while (args.length > 0) {
            const arg = args.shift();
            if (VERBOSE.includes(arg)) {
                verbose = true;
            } else {
                return print(`${arg} is an unknown argument.`, { type: ERROR });
            }
        }

        if (!isDocx(filePath))
            return;

        Validator.validate(fs.readFileSync(filePath), { verbose })
            .then(errors => errors.length === 0 ?
                print('No errors found.') :
                errors.forEach(Validator.log));
        break;
    }
    case ACTION.DIFF: {
        if (args.find(arg => HELP.includes(arg)))
            return print(ml`
                -t, --type      | Default diff type is 'directory' but may also diff each 'file'
                -o, --output    | Default output is 'console' but may also be output as 'json'
                -v, --verbose   | Providing this argument will log each step of the diff
            `, { type: ERROR });

        if (args.length < 2)
            return print('Two .docx file paths are required as arguments.', { type: ERROR });

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
                return print(`${arg} is an unknown argument.`, { type: ERROR });
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
        return print(`${action} is an unknown .docx action.`, { type: ERROR });
}