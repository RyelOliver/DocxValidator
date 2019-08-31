const fs = require('fs');
const Differ = require('./Differ');

describe('Differ', () => {
    it('Should log that two .docx files are identical', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation();

        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/Old (copy).docx');

        await Differ.diff(oldFile, oldFile);

        expect(log).toHaveBeenLastCalledWith('The two .docx files are identical.');

        await Differ.diff(oldFile, newFile);

        expect(log).toHaveBeenLastCalledWith('The two .docx files are identical.');

        log.mockRestore();
    });

    it('Should output the changed files to the console', async () => {
        const log = jest.spyOn(console, 'log').mockImplementation();

        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/New.docx');

        await Differ.diff(oldFile, newFile, { type: 'directory' });

        const GREEN_FOREGROUND = '\x1b[32m%s\x1b[0m';
        const YELLOW_FOREGROUND = '\x1b[33m%s\x1b[0m';
        expect(log).toHaveBeenCalledWith(
            GREEN_FOREGROUND, 'The word/comments.xml file was added',
        );
        expect(log).toHaveBeenCalledWith(
            YELLOW_FOREGROUND, 'The word/settings.xml file was modified',
        );

        log.mockRestore();
    });

    it('Should output the changed files as JSON', async () => {
        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/New.docx');

        const output = await Differ.diff(oldFile, newFile, { type: 'directory', output: 'json' });

        expect(output).toEqual(expect.arrayContaining([
            { insert: true, filePath: 'word/comments.xml', type: 'directory' },
            { modified: true, filePath: 'word/settings.xml', type: 'directory' },
        ]));
    });

    it('Should output the changed lines as JSON', async () => {
        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/New.docx');

        const output = await Differ.diff(oldFile, newFile, { output: 'json' });

        expect(output).toEqual(expect.arrayContaining([
            {
                insert: true,
                filePath: 'word/comments.xml',
                type: 'directory',
            },
            {
                modified: true,
                filePath: 'word/settings.xml',
                type: 'directory',
            },
            {
                insert: true,
                line: '        <w:rsid w:val="690A1F2E"/>',
                lineNumber: 43,
                filePath: 'word/settings.xml',
                type: 'file',
            },
        ]));
    });
});