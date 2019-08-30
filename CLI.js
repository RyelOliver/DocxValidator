#! /usr/bin/env node

const fs = require('fs');
const DocxValidator = require('./DocxValidator');

const args = process.argv.slice(2);

async function validate (filePath) {
    const file = fs.readFileSync(filePath);

    const fileExtension = filePath.substring(filePath.lastIndexOf('.'));
    if (fileExtension.toLowerCase() !== '.docx')
        return console.error(`${filePath} is not a .docx.`);

    const errors = await DocxValidator.validate(file);
    errors.forEach(DocxValidator.log);
}

const filePath = args[0];

if (!filePath)
    return console.error('A path to the file to validate must be provided.');

validate(filePath)
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