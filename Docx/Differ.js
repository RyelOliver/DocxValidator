const { print } = require('../Utility');
const { STYLE } = print;
const Zip = require('../Zip');
const XML = require('../XML');
const Diff = require('../Diff');

const TYPE = {
    DIRECTORY: 'directory',
    FILE: 'file',

    JSON: 'json',
    LOG: 'log',

    DELETE: 'delete',
    INSERT: 'insert',
};

let _verbose = false;

const outputChanges = changes => {
    const output = changes
        .reduce((groupedByFilePath, change) => {
            const grouped = groupedByFilePath.find(grouped => {
                return grouped.filePath === change.filePath;
            });

            if (grouped) {
                grouped.changes.push(change);
            } else {
                groupedByFilePath.push({
                    filePath: change.filePath,
                    changes: [ change ],
                });
            }

            return groupedByFilePath;
        }, [])
        .map(({ filePath, changes }) => {
            const chunks = changes
                .filter(({ type }) => type === TYPE.FILE)
                .reduce((chunks, change) => {
                    const chunk = chunks.find(chunk => {
                        return chunk.lineNumber === change.lineNumber;
                    });

                    if (chunk) {
                        if (change.insert) {
                            chunk.insertedLines.push(change.line);
                        } else {
                            chunk.deletedLines.push(change.line);
                        }
                    } else {
                        const insertedLines = [];
                        const deletedLines = [];
                        if (change.insert) {
                            insertedLines.push(change.line);
                        } else {
                            deletedLines.push(change.line);
                        }

                        chunks.push({
                            filePath,
                            insertedLines,
                            deletedLines,
                            lineNumber: change.lineNumber,
                        });
                    }

                    return chunks;
                }, []);

            if (chunks.length === 0) {
                if (changes.some(change => change.insert)) {
                    return {
                        filePath,
                        insert: true,
                        chunks,
                    };
                } else if (changes.some(change => change.delete)) {
                    return {
                        filePath,
                        delete: true,
                        chunks,
                    };
                } else {
                    return {
                        filePath,
                        chunks,
                    };
                }
            } else {
                return {
                    filePath,
                    chunks,
                };
            }
        }, [])
        .reduce((summary, groupedChanges) => {
            const insertCount = groupedChanges.chunks.reduce((insertCount, chunk) => {
                return insertCount + chunk.insertedLines.length;
            }, 0);
            const deleteCount = groupedChanges.chunks.reduce((deleteCount, chunk) => {
                return deleteCount + chunk.deletedLines.length;
            }, 0);

            let diffString, style;
            if (insertCount + deleteCount === 0) {
                if (groupedChanges.insert) {
                    diffString = 'added';
                    style = STYLE.GREEN;
                } else if (groupedChanges.delete) {
                    diffString = 'removed';
                    style = STYLE.RED;
                } else {
                    diffString = 'modified';
                    style = STYLE.YELLOW;
                }
            } else {
                diffString = `+${insertCount}/-${deleteCount}`;
            }
            const filePathString = `${diffString}${' '.repeat(16 - diffString.length)}${groupedChanges.filePath}`;
            const output = { filePath: groupedChanges.filePath, message: filePathString, style };

            if (!summary.filePaths) {
                summary.filePaths = [ output ];
            } else {
                const filePath = summary.filePaths.find(filePath => filePath === groupedChanges.filePath);
                if (!filePath) {
                    summary.filePaths.push(output);
                }
            }

            if (!summary.chunks) {
                summary.chunks = [ ...groupedChanges.chunks ];
            } else {
                summary.chunks.push(...groupedChanges.chunks);
            }

            return summary;
        }, {});

    print('');
    print('diff            path', { style: STYLE.BOLD });
    output.filePaths.forEach(({ message, style }) => {
        print(message, { style });
    });
    print('');

    output.chunks.forEach(chunk => {
        const chunkCount = [
            '@@',
            `-${chunk.lineNumber}${chunk.deletedLines.length === 1 ? '' : `,${chunk.deletedLines.length}`}`,
            `+${chunk.lineNumber}${chunk.insertedLines.length === 1 ? '' : `,${chunk.insertedLines.length}`}`,
            '@@',
        ].join(' ');

        print(`--- ${chunk.filePath}`, { style: STYLE.BOLD });
        print(`+++ ${chunk.filePath}`, { style: STYLE.BOLD });
        print(chunkCount, { style: STYLE.TEAL });

        chunk.deletedLines.forEach(line => {
            print(`-${line}`, { style: STYLE.RED });
        });
        chunk.insertedLines.forEach(line => {
            print(`+${line}`, { style: STYLE.GREEN });
        });
        print('');
    });
};

const getFilePathChanges = async ({ oldZip, newZip, oldFilePaths, newFilePaths }) => {
    if (_verbose)
        print('Getting file path changes...');

    const changes = [];

    oldFilePaths.forEach(filePath => {
        if (!newFilePaths.includes(filePath))
            changes.push({ delete: true, filePath, type: TYPE.DIRECTORY });
    });

    const deletedFilePaths = changes
        .map(({ filePath }) => filePath);
    const unmodifiedFilePaths = oldFilePaths
        .filter(filePath => !deletedFilePaths.includes(filePath));

    newFilePaths.forEach(filePath => {
        if (!oldFilePaths.includes(filePath))
            changes.push({ insert: true, filePath, type: TYPE.DIRECTORY });
    });

    await forEach(unmodifiedFilePaths, async filePath => {
        const oldFile = XML.format(await oldZip.read(filePath));
        const newFile = XML.format(await newZip.read(filePath));

        if (oldFile !== newFile)
            changes.push({ modified: true, filePath, type: TYPE.DIRECTORY });
    });

    return changes;
};

const forEach = (array, callback) => Promise.all(array.map(callback));

const getFileContentChanges = async ({ oldZip, newZip, filePaths }) => {
    if (_verbose)
        print('Getting file content changes...');

    const changes = [];

    await forEach(filePaths, async filePath => {
        if (_verbose)
            print(`Reading ${filePath}...`);

        const oldFile = XML.format(await oldZip.read(filePath));
        const newFile = XML.format(await newZip.read(filePath));

        const oldLines = oldFile.split('\n');
        const newLines = newFile.split('\n');

        if (_verbose)
            print(`Diffing ${filePath}...`);

        const fileChanges = Diff.lines({ oldLines, newLines })
            .map(change => ({ ...change, filePath, type: TYPE.FILE }));
        changes.push(...fileChanges);
    });

    return changes;
};

const diff = async (oldFile, newFile, { type = TYPE.FILE, output = TYPE.LOG, verbose } = {}) => {
    _verbose = verbose;

    if (!Buffer.compare(oldFile, newFile))
        return print('The two .docx files are identical.');

    if (_verbose)
        print('Unzipping files...');

    const [ oldZip, newZip ] = await Promise.all(
        [ oldFile, newFile ]
            .map(file => Zip.unzip(file))
    );

    const oldFilePaths = oldZip.files;
    const newFilePaths = newZip.files;

    const changes = [];
    switch (type) {
        case TYPE.DIRECTORY:
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
        case TYPE.JSON:
            return changes;
        default:
            return outputChanges(changes);
    }
};

module.exports = {
    diff,
};