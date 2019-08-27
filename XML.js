const { DOMParser } = require('xmldom');

function parse (xml) {
    return new DOMParser().parseFromString(xml);
}

function shouldUnindent (line) {
    return line.match(/^<\/.*>$/);
}

function shouldNotIndent (line) {
    return line.match(/^<\?.*\?>$/) ||
        line.match(/^<.*\/>$/) ||
        line.match(/^<.*?>.*?<\/.*?>$/);
}

function shouldIndent (line) {
    return line.match(/^<.*>$/) && !shouldNotIndent(line);
}

function indent (line) {
    return {
        by: function (tabs) {
            return `${'    '.repeat(tabs >= 0 ? tabs : 0)}${line}`;
        },
    };
}

function format (xml) {
    const lines = xml
        .replace(/></g, '>\n<')
        .replace(/\s*\/>/g, '/>')
        .split('\n')
        .map(line => line.trim());
    let tabs = 0;
    const indentedLines = lines.map(line => {
        if (shouldUnindent(line)) {
            tabs--;
            line = indent(line).by(tabs);
        } else if (shouldIndent(line)) {
            line = indent(line).by(tabs);
            tabs++;
        } else {
            line = indent(line).by(tabs);
        }

        return line;
    });
    return indentedLines.join('\n');
}

const XML = {
    indent,
    format,
    parse,
};

module.exports = XML;