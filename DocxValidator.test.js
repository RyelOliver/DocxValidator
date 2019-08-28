const fs = require('fs').promises;
const DocxValidator = require('./DocxValidator');

describe('DocxValidator', () => {
    it('Should not return any errors', async () => {
        const file = await fs.readFile('./fixtures/File.docx');
        const errors = await DocxValidator.validate(file);
        expect(errors).toEqual([]);
    });
});