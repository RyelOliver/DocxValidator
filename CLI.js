#! /usr/bin/env node

const fs = require('fs');
const DocxValidator = require('./DocxValidator');

const args = process.argv.slice(2);

async function validate (filePath, { verbose }) {
    const file = fs.readFileSync(filePath);

    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    if (fileExtension.toLowerCase() !== '.docx')
        return console.error(`${filePath} is not a .docx.`);

    const errors = await DocxValidator.validate(file, { verbose });
    errors.forEach(DocxValidator.log);
}

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