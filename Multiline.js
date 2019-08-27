function first (array) {
    return array[0];
}

function last (array) {
    return array[array.length - 1];
}

function multiline (strings, ...expressions) {
    const string = strings
        .reduce((interpolated, string) => {
            const expression = expressions.shift();
            return `${interpolated}${string}${expression === undefined ? '' : expression}`;
        }, '');

    const lines = string.split('\n');

    if (first(lines).trim() === '')
        lines.shift();

    if (last(lines).trim() === '')
        lines.pop();

    let leadingCharsToTrim;
    lines
        .forEach(line => {
            const leadingWhiteSpaceChars = line.match(/^(\s*)/)[0].length;

            if (leadingCharsToTrim === undefined || leadingWhiteSpaceChars < leadingCharsToTrim)
                leadingCharsToTrim = leadingWhiteSpaceChars;
        });

    return lines
        .map(line => line.substring(leadingCharsToTrim))
        .join('\n');
}

module.exports = multiline;