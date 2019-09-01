const fs = require('fs');
const { print } = require('../Utility');
const Zip = require('../Zip');
const XML = require('../XML');

let _verbose = false;

async function debug (filePath, { verbose } = {}) {
    _verbose = verbose;

    if (_verbose)
        print('Reading file...');

    const file = fs.readFileSync(filePath);

    if (_verbose)
        print('Unzipping file...');

    const zip = await Zip.unzip(file);

    const dirPath = filePath.match(/^(.*)\.docx$/)[1];
    fs.mkdirSync(dirPath);

    if (_verbose)
        print('Making directories...');

    zip.directories
        .forEach(directory => fs.mkdirSync(`${dirPath}/${directory}`));

    if (_verbose)
        print('Writing files...');

    const promises = zip.files
        .map(async fileName => {
            if (_verbose)
                print(`Writing ${fileName}...`);

            const process = fileName.match(/(\.xml|\.rels)$/) ? XML.format : () => {};
            const file = process(await zip.read(fileName));

            fs.writeFileSync(`${dirPath}/${fileName}`, file);
        });

    await promises;

    print(`.docx extracted to ${dirPath}`);
}

module.exports = {
    debug,
};