const Diff = require('./Diff');

describe('Diff', () => {
    describe('Lines in common', () => {
        it('Should return an empty array if there are no lines in common', () => {
            expect(
                Diff.lines.common({ oldLines: [], newLines: [] })
            ).toEqual([]);

            expect(
                Diff.lines.common({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ], newLines: [
                        'tomato',
                        'potato',
                    ],
                })
            ).toEqual([]);
        });

        it('Should return an array of the one line in common', () => {
            expect(
                Diff.lines.common({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ], newLines: [
                        'tomato',
                        'dolor',
                        'potato',
                    ],
                })
            ).toEqual([ 2, 3 ]);
        });

        it('Should return an array of the lines in common', () => {
            expect(
                Diff.lines.common({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ], newLines: [
                        'tomato',
                        'ipsum',
                        'dolor',
                        'sit',
                        'potato',
                    ],
                })
            ).toEqual([ 1, 4 ]);

            expect(
                Diff.lines.common({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ], newLines: [
                        'tomato',
                        'dolor',
                        'sit',
                        'amet',
                    ],
                })
            ).toEqual([ 2, 5 ]);
        });
    });

    describe('Diff of lines', () => {
        it('Should return an empty array for two identical arrays of lines', () => {
            expect(
                Diff.lines({ oldLines: [], newLines: [] })
            ).toEqual([]);

            const lines = [
                'Lorem ipsum',
                'Dolor sit amet',
            ];
            expect(
                Diff.lines({ oldLines: lines, newLines: lines })
            ).toEqual([]);
        });

        it('Should return an array of changed lines', () => {
            expect(
                Diff.lines({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ],
                    newLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                    ],
                })
            ).toEqual([
                { delete: true, line: 'sit', lineNumber: 4 },
                { delete: true, line: 'amet', lineNumber: 5 },
            ]);

            expect(
                Diff.lines({
                    oldLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                    ],
                    newLines: [
                        'lorem',
                        'potato',
                        'ipsum',
                        'dolor',
                    ],
                })
            ).toEqual([
                { insert: true, line: 'potato', lineNumber: 2 },
                { delete: true, line: 'sit', lineNumber: 4 },
                { delete: true, line: 'amet', lineNumber: 5 },
            ]);

            expect(
                Diff.lines({
                    oldLines: [
                        'lorem',
                        'potato',
                        'ipsum',
                        'dolor',
                        'turnip',
                        'consectetur',
                    ],
                    newLines: [
                        'lorem',
                        'ipsum',
                        'dolor',
                        'sit',
                        'amet',
                        'consectetur',
                    ],
                })
            ).toEqual([
                { delete: true, line: 'potato', lineNumber: 2 },
                { delete: true, line: 'turnip', lineNumber: 5 },
                { insert: true, line: 'sit', lineNumber: 5 },
                { insert: true, line: 'amet', lineNumber: 5 },
            ]);
        });
    });
});