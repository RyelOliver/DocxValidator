const {
    isNil,
    hasLeadingOrTrailingWhiteSpace,
} = require('./Utility');

describe('Utility', () => {
    describe('Nil', () => {
        it('Should return true', () => {
            [ null, undefined ].forEach(value => {
                const actual = isNil(value);
                expect(actual).toBeTruthy();
            });
        });

        it('Should return false', () => {
            [ '', 'a', 0, 1 ].forEach(value => {
                const actual = isNil(value);
                expect(actual).toBeFalsy();
            });
        });
    });

    describe('White space', () => {
        it('Should return true', () => {
            [ 'lorem ', ' ipsum' ].forEach(value => {
                const actual = hasLeadingOrTrailingWhiteSpace(value);
                expect(actual).toBeTruthy();
            });
        });

        it('Should return false', () => {
            [ 'dolor', 'sit amet' ].forEach(value => {
                const actual = hasLeadingOrTrailingWhiteSpace(value);
                expect(actual).toBeFalsy();
            });
        });
    });
});