const ml = require('./Multiline');
const XML = require('./XML');

describe('XML', () => {
    describe('Indent', () => {
        it('Should not indent', () => {
            [ 0, -3 ].forEach(tabs => {
                const actual = XML.indent('<w:t>Lorem ipsum</w:t>').by(tabs);
                expect(actual).toEqual('<w:t>Lorem ipsum</w:t>');
            });
        });

        it('Should indent', () => {
            const actual = XML.indent('<w:t>Lorem ipsum</w:t>').by(1);
            expect(actual).toEqual('    <w:t>Lorem ipsum</w:t>');
        });

        it('Should indent by more than 1 tab', () => {
            const actual = XML.indent('<w:t>Lorem ipsum</w:t>').by(3);
            expect(actual).toEqual('            <w:t>Lorem ipsum</w:t>');
        });
    });

    it('Should format XML', () => {
        const actual = XML.format('<w:r><w:t>Lorem ipsum</w:t></w:r><w:r><w:t xml:space="preserve"> dolor sit amet</w:t></w:r>');
        expect(actual).toEqual(ml`
            <w:r>
                <w:t>Lorem ipsum</w:t>
            </w:r>
            <w:r>
                <w:t xml:space="preserve"> dolor sit amet</w:t>
            </w:r>
        `);
    });
});