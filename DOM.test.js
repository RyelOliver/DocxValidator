const ml = require('./Multiline');
const XML = require('./XML');
const {
    xPath,
    get,
    getFirst,
    getLast,
    getAll,
    within,
    stringify,
} = require('./DOM');

describe('Parse', () => {
    it('Should parse a child selector', () => {
        const actual = xPath.parse('//w:rsid');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ 'w:rsid' ],
                    direct: false,
                    predicates: [],
                },
            },
        ]);
    });

    it('Should parse a direct child selector', () => {
        const actual = xPath.parse('/w:settings/w:rsids');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ 'w:settings' ],
                    direct: true,
                    predicates: [],
                },
            },
            {
                childNode: {
                    nodeName: [ 'w:rsids' ],
                    direct: true,
                    predicates: [],
                },
            },
        ]);
    });

    it('Should parse multiple child selectors', () => {
        const actual = xPath.parse('//w:shapeDefaults//o:idmap');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ 'w:shapeDefaults' ],
                    direct: false,
                    predicates: [],
                },
            },
            {
                childNode: {
                    nodeName: [ 'o:idmap' ],
                    direct: false,
                    predicates: [],
                },
            },
        ]);
    });

    it('Should parse wildcard selectors', () => {
        const actual = xPath.parse('/w:settings/*');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ 'w:settings' ],
                    direct: true,
                    predicates: [],
                },
            },
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: true,
                    predicates: [],
                },
            },
        ]);
    });

    it('Should parse an order predicate', () => {
        const actual = xPath.parse('//*[10]');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: false,
                    predicates: [ { order: 10 } ],
                },
            },
        ]);
    });

    it('Should parse a node with an attribute', () => {
        const actual = xPath.parse('//*[@spidmax]');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: false,
                    predicates: [ { attribute: { name: 'spidmax' } } ],
                },
            },
        ]);
    });

    it('Should parse a node with an attribute value', () => {
        const actual = xPath.parse('//*[@w:val=","]');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: false,
                    predicates: [ { attribute: { name: 'w:val', value: ',' } } ],
                },
            },
        ]);
    });

    it('Should parse a node with two attribute values', () => {
        const actual = xPath.parse('//*[@v:ext="edit"][@data="1"]');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: false,
                    predicates: [
                        { attribute: { name: 'v:ext', value: 'edit' } },
                        { attribute: { name: 'data', value: '1' } },
                    ],
                },
            },
        ]);
    });

    it('Should parse a node with a child node', () => {
        const actual = xPath.parse('//*[/o:idmap]');
        expect(actual).toEqual([
            {
                childNode: {
                    nodeName: [ '*' ],
                    direct: false,
                    predicates: [
                        {
                            childNode: {
                                nodeName: [ 'o:idmap' ],
                                direct: true,
                                predicates: [],
                            },
                        },
                    ],
                },
            },
        ]);
    });

    it('Should parse an attribute', () => {
        const actual = xPath.parse('/@w:val');
        expect(actual).toEqual([
            {
                attributeName: [ 'w:val' ],
            },
        ]);
    });
});

describe('DOM', () => {
    let document;
    beforeAll(() => {
        document = XML.parse(ml`
            <?xml version="1.0" encoding="utf-8" standalone="yes"?>
            <w:settings xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:sl="http://schemas.openxmlformats.org/schemaLibrary/2006/main" mc:Ignorable="w14 w15">
                <w:zoom w:percent="100"/>
                <w:defaultTabStop w:val="720"/>
                <w:characterSpacingControl w:val="doNotCompress"/>
                <w:compat>
                    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
                    <w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
                    <w:compatSetting w:name="enableOpenTypeFeatures" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
                    <w:compatSetting w:name="doNotFlipMirrorIndents" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
                    <w:compatSetting w:name="differentiateMultirowTableHeaders" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>
                </w:compat>
                <m:mathPr>
                    <m:mathFont m:val="Cambria Math"/>
                    <m:brkBin m:val="before"/>
                    <m:brkBinSub m:val="--"/>
                    <m:smallFrac m:val="0"/>
                    <m:dispDef/>
                    <m:lMargin m:val="0"/>
                    <m:rMargin m:val="0"/>
                    <m:defJc m:val="centerGroup"/>
                    <m:wrapIndent m:val="1440"/>
                    <m:intLim m:val="subSup"/>
                    <m:naryLim m:val="undOvr"/>
                </m:mathPr>
                <w:themeFontLang w:val="en-GB"/>
                <w:clrSchemeMapping w:bg1="light1" w:t1="dark1" w:bg2="light2" w:t2="dark2" w:accent1="accent1" w:accent2="accent2" w:accent3="accent3" w:accent4="accent4" w:accent5="accent5" w:accent6="accent6" w:hyperlink="hyperlink" w:followedHyperlink="followedHyperlink"/>
                <w:shapeDefaults>
                    <o:shapedefaults v:ext="edit" spidmax="1026"/>
                    <o:shapelayout v:ext="edit">
                        <o:idmap v:ext="edit" data="1"/>
                    </o:shapelayout>
                </w:shapeDefaults>
                <w:decimalSymbol w:val="."/>
                <w:listSeparator w:val=","/>
                <w15:chartTrackingRefBased/>
                <w14:docId w14:val="1903DDD1"/>
                <w15:docId w15:val="{c4c1ea30-c84f-428d-86d1-1c649ded0d70}"/>
                <w:rsids>
                    <w:rsidRoot w:val="2DF56044"/>
                    <w:rsid w:val="2DF56044"/>
                    <w:rsid w:val="6332322D"/>
                </w:rsids>
            </w:settings>
        `);
    });

    describe('Get', () => {
        it('Should get all nodes matching an xPath', () => {
            const xPath = '/w:settings/w:rsids/w:rsid';
            [
                get(xPath).all().within(document),
                getAll(xPath).within(document),
                within(document).all().get(xPath),
                within(document).getAll(xPath),
            ].forEach(nodes => {
                const actual = nodes.map(node => stringify(node));
                expect(actual).toEqual([
                    '<w:rsid w:val="2DF56044"/>',
                    '<w:rsid w:val="6332322D"/>',
                ]);
            });
        });

        it('Should get ths first node matching an xPath', () => {
            const xPath = '/w:settings/w:rsids/w:rsid';
            [
                get(xPath).within(document),
                get(xPath).first().within(document),
                getFirst(xPath).within(document),
                within(document).get(xPath),
                within(document).first().get(xPath),
                within(document).getFirst(xPath),
            ].forEach(node => {
                const actual = stringify(node);
                expect(actual).toEqual('<w:rsid w:val="2DF56044"/>');
            });
        });

        it('Should get ths last node matching an xPath', () => {
            const xPath = '/w:settings/w:rsids/w:rsid';
            [
                get(xPath).last().within(document),
                getLast(xPath).within(document),
                within(document).last().get(xPath),
                within(document).getLast(xPath),
            ].forEach(node => {
                const actual = stringify(node);
                expect(actual).toEqual('<w:rsid w:val="6332322D"/>');
            });
        });

        it('Should get all direct children', () => {
            const nodes = within(document).getAll('/w:settings/*');
            const actual = nodes.map(node => node.nodeName);
            expect(actual).toEqual([
                'w:zoom',
                'w:defaultTabStop',
                'w:characterSpacingControl',
                'w:compat',
                'm:mathPr',
                'w:themeFontLang',
                'w:clrSchemeMapping',
                'w:shapeDefaults',
                'w:decimalSymbol',
                'w:listSeparator',
                'w15:chartTrackingRefBased',
                'w14:docId',
                'w15:docId',
                'w:rsids',
            ]);
        });

        it('Should get the nth node', () => {
            const node = within(document).get('/w:settings/*[10]');
            const actual = stringify(node);
            expect(actual).toEqual('<w:listSeparator w:val=","/>');
        });

        it('Should get a node with an attribute', () => {
            const node = within(document).get('//*[@spidmax]');
            const actual = stringify(node);
            expect(actual).toEqual('<o:shapedefaults v:ext="edit" spidmax="1026"/>');
        });

        it('Should get a node with an attribute value', () => {
            const node = within(document).get('//*[@w:val=","]');
            const actual = stringify(node);
            expect(actual).toEqual('<w:listSeparator w:val=","/>');
        });

        it('Should get a node with two attribute values', () => {
            const node = within(document).get('//*[@v:ext="edit"][@data="1"]');
            const actual = stringify(node);
            expect(actual).toEqual('<o:idmap v:ext="edit" data="1"/>');
        });

        it('Should get a node with a child node', () => {
            const node = within(document).get('//*[/o:idmap]');
            const actual = stringify(node);
            expect(actual).toEqual(ml`
                <o:shapelayout v:ext="edit">
                    <o:idmap v:ext="edit" data="1"/>
                </o:shapelayout>
            `);
        });
    });

    describe('Stringify', () => {
        it('Should stringify a node and its attributes', () => {
            const node = within(document).getLast('/w:settings/w:compat/w:compatSetting');
            const actual = stringify(node);
            expect(actual).toEqual('<w:compatSetting w:name="differentiateMultirowTableHeaders" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>');
        });

        it('Should stringify a node and its children', () => {
            const node = within(document).get('/w:settings/w:rsids');
            const actual = stringify(node);
            expect(actual).toEqual(ml`
                <w:rsids>
                    <w:rsidRoot w:val="2DF56044"/>
                    <w:rsid w:val="2DF56044"/>
                    <w:rsid w:val="6332322D"/>
                </w:rsids>
            `);
        });
    });
});