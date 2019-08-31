const Zip = require('../Zip');
const XML = require('../XML');
const Diff = require('../Diff');

const Type = {
    directory: 'directory',
    file: 'file',

    json: 'json',
    console: 'console',

    delete: 'delete',
    insert: 'insert',
};

const Log = (...args) => {
    return console.log(...args);
};
Log.delete = (...args) => {
    return Log('\x1b[31m%s\x1b[0m', ...args);
};
Log.insert = (...args) => {
    return Log('\x1b[32m%s\x1b[0m', ...args);
};
Log.modified = (...args) => {
    return Log('\x1b[33m%s\x1b[0m', ...args);
};
Log.changes = changes => {
    changes.forEach(change => {
        let type;
        if (change.insert) {
            type = 'insert';
        } else if (change.delete) {
            type = 'delete';
        } else {
            type = 'modified';
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
            Log[type](change.line);
            const action = type === Type.insert ?
                'added to' :
                type === Type.delete ?
                    'removed from' :
                    'modified';
            description =
            `Was ${action} ${change.filePath} at line ${change.lineNumber}`;
        }

        Log[type](description);
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

const diff = async (oldFile, newFile, { type = Type.file, output = Type.console } = {}) => {
    if (!Buffer.compare(oldFile, newFile))
        return Log('The two .docx files are identical.');

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
            return Log.changes(changes);
    }
};

module.exports = {
    diff,
};