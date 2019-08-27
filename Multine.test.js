const ml = require('./Multiline');

describe('Multiline', () => {
    it('Should return a single line without any leading white space', () => {
        expect(ml`Foo`).toBe('Foo');

        expect(ml`    Foo`).toBe('Foo');
    });

    it('Should return multiple lines without the minimum leading white space', () => {
        expect(ml`
            Foo
            Bar
            Pie
        `).toBe('Foo\nBar\nPie');

        expect(ml`
            Foo
                Bar
            Pie
        `).toBe('Foo\n    Bar\nPie');
    });

    it('Should return an interpolated string', () => {
        expect(ml`${'Foo'} bar ${'pie'}`).toBe('Foo bar pie');

        expect(ml`
            ${'Foo'}
            bar
            ${'pie'}
        `).toBe('Foo\nbar\npie');

        expect(ml`
            ${'Foo'}
                bar
            ${'pie'}
        `).toBe('Foo\n    bar\npie');
    });
});