const fs = require('fs').promises;
const Validator = require('./Validator');

describe('Validator', () => {
    it('Should not return any errors', async () => {
        const file = await fs.readFile('./fixtures/File.docx');
        const errors = await Validator.validate(file);
        expect(errors).toEqual([]);
    });
});