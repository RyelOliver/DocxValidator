#! /usr/bin/env node

const fs = require('fs');
const Validator = require('./Docx/Validator');

const ACTION = {
    DEBUG: 'debug',
    VALIDATE: 'validate',
    DIFF: 'diff',
};

const args = process.argv.slice(2);

if (args.length === 0)
    return console.error(`One of the following .docx actions must be provided:\n${Object.values(ACTION).map(action => `- ${action}`).join('\n')}`);

async function validate (filePath, { verbose }) {
    const file = fs.readFileSync(filePath);

    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    if (fileExtension.toLowerCase() !== '.docx')
        return console.error(`${filePath} is not a .docx.`);

    const errors = await Validator.validate(file, { verbose });
    errors.length === 0 ?
        console.info('No errors found.') :
        errors.forEach(Validator.log);
}

const action = args.shift();
switch (action) {
    case ACTION.DEBUG:
    case ACTION.DIFF:
        return console.error(`${action} is an unimplemented .docx action.`);
    case ACTION.VALIDATE: {
        if (args.length === 0)
            return console.error('A path to the file to validate must be provided.');

        let filePath,
            verbose;

        if (args.length === 1) {
            filePath = args[0];
        } else {
            filePath = args[0];
            const VERBOSE = [
                '-v',
                '--verbose',
            ];
            verbose = !!args.find(arg => VERBOSE.includes(arg));
        }

        validate(filePath, { verbose })
            .catch(error => {
                switch (error.code) {
                    case 'ENOENT':
                        console.error(`${filePath} is not a file or directory.`);
                        break;
                    case 'EISDIR':
                        console.error(`${filePath} is not a file.`);
                        break;
                    default:
                        throw error;
                }
            });
        break;
    }
    default:
        return console.error(`${action} is an unknown .docx action.`);
}