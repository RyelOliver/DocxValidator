const { print } = require('../Utility');
const { STYLE } = print;
const Zip = require('../Zip');
const XML = require('../XML');
const Diff = require('../Diff');

const Type = {
    directory: 'directory',
    file: 'file',

    json: 'json',
    print: 'print',

    delete: 'delete',
    insert: 'insert',
};

const outputChanges = changes => {
    changes.forEach(change => {
        let type, style;
        if (change.insert) {
            type = 'insert';
            style = STYLE.GREEN;
        } else if (change.delete) {
            type = 'delete';
            style = STYLE.RED;
        } else {
            type = 'modified';
            style = STYLE.YELLOW;
        }

        let description;
        if (change.type === Type.directory) {
            const action = type === Type.insert ?
                'added' :
                type === Type.delete ?
                    'removed' :
                    'modified';
            description = `The ${change.filePath} file was ${action}`;
        } else {
            print(change.line, { style });
            const action = type === Type.insert ?
                'added to' :
                type === Type.delete ?
                    'removed from' :
                    'modified';
            description =
            `Was ${action} ${change.filePath} at line ${change.lineNumber}`;
        }

        print(description, { style });
    });
};

const getFilePathChanges = async ({ oldZip, newZip, oldFilePaths, newFilePaths }) => {
    const changes = [];

    oldFilePaths.forEach(filePath => {
        if (!newFilePaths.includes(filePath))
            changes.push({ delete: true, filePath, type: Type.directory });
    });

    const deletedFilePaths = changes
        .map(({ filePath }) => filePath);
    const unmodifiedFilePaths = oldFilePaths
        .filter(filePath => !deletedFilePaths.includes(filePath));

    newFilePaths.forEach(filePath => {
        if (!oldFilePaths.includes(filePath))
            changes.push({ insert: true, filePath, type: Type.directory });
    });

    await forEach(unmodifiedFilePaths, async filePath => {
        const oldFile = XML.format(await oldZip.read(filePath));
        const newFile = XML.format(await newZip.read(filePath));

        if (oldFile !== newFile)
            changes.push({ modified: true, filePath, type: Type.directory });
    });

    return changes;
};

const forEach = (array, callback) => Promise.all(array.map(callback));

const getFileContentChanges = async ({ oldZip, newZip, filePaths }) => {
    const changes = [];

    await forEach(filePaths, async filePath => {
        const oldFile = XML.format(await oldZip.read(filePath));
        const newFile = XML.format(await newZip.read(filePath));

        const oldLines = oldFile.split('\n');
        const newLines = newFile.split('\n');

        const fileChanges = Diff.lines({ oldLines, newLines })
            .map(change => ({ ...change, filePath, type: Type.file }));
        changes.push(...fileChanges);
    });

    return changes;
};

const diff = async (oldFile, newFile, { type = Type.file, output = Type.print } = {}) => {
    if (!Buffer.compare(oldFile, newFile))
        return print('The two .docx files are identical.');

    const [ oldZip, newZip ] = await Promise.all(
        [ oldFile, newFile ]
            .map(file => Zip.unzip(file))
    );

    const oldFilePaths = oldZip.files;
    const newFilePaths = newZip.files;

    const changes = [];
    switch (type) {
        case Type.directory:
            changes.push(...await getFilePathChanges({
                oldZip, newZip, oldFilePaths, newFilePaths,
            }));
            break;
        default: {
            changes.push(...await getFilePathChanges({
                oldZip, newZip, oldFilePaths, newFilePaths,
            }));
            const filePaths = changes
                .filter(({ modified }) => modified)
                .map(({ filePath }) => filePath);
            changes.push(...await getFileContentChanges({ oldZip, newZip, filePaths }));
            break;
        }
    }

    switch (output) {
        case Type.json:
            return changes;
        default:
            return outputChanges(changes);
    }
};

module.exports = {
    diff,
};