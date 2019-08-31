const fs = require('fs');
const { print: { STYLE } } = require('../Utility');
const Differ = require('./Differ');

describe('Differ', () => {
    it('Should log that two .docx files are identical', async () => {
        const info = jest.spyOn(console, 'info').mockImplementation();

        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/Old (copy).docx');

        await Differ.diff(oldFile, oldFile);

        expect(info).toHaveBeenLastCalledWith('The two .docx files are identical.');

        await Differ.diff(oldFile, newFile);

        expect(info).toHaveBeenLastCalledWith('The two .docx files are identical.');

        info.mockRestore();
    });

    it('Should output the changed files to the console', async () => {
        const info = jest.spyOn(console, 'info').mockImplementation();

        const oldFile = fs.readFileSync('fixtures/Old.docx');
        const newFile = fs.readFileSync('fixtures/New.docx');

        await Differ.diff(oldFile, newFile, { type: 'directory' });

        expect(info).toHaveBeenCalledWith(
            STYLE.GREEN, 'The word/comments.xml file was added',
        );
        expect(info).toHaveBeenCalledWith(
            STYLE.YELLOW, 'The word/settings.xml file was modified',
        );

        info.mockRestore();
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