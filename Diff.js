
const lines = ({ oldLines, newLines, lineOffset = 1 }) => {
    const diff = [];

    const linesInCommon = lines.common({ oldLines, newLines });

    if (linesInCommon.length === 0) {
        const deletedLines = oldLines
            .map((line, lineNumber) => ({
                delete: true, line, lineNumber: lineNumber + lineOffset,
            }));
        const insertedLines = newLines
            .map(line => ({ insert: true, line, lineNumber: lineOffset }));
        diff.push(...deletedLines.concat(insertedLines));
    } else {
        const [ oldStart, oldEnd ] = linesInCommon;
        const unmodifiedLines = oldLines.slice(oldStart, oldEnd);
        const unmodifiedLinesAsString = unmodifiedLines.join('\n');

        const oldLinesBefore = oldLines.slice(0, oldStart);
        const oldLinesAfter = oldLines.slice(oldEnd);

        const newLinesAsString = newLines.join('\n');

        const newStart = newLinesAsString.indexOf(unmodifiedLinesAsString);
        const newEnd = newStart + unmodifiedLinesAsString.length;
        const newLinesBefore = newStart === 0 ?
            [] : newLinesAsString.substring(0, newStart - 1).split('\n');
        const newLinesAfter = newEnd === newLinesAsString.length ?
            [] : newLinesAsString.substring(newEnd + 1).split('\n');

        diff.push(...lines({ oldLines: oldLinesBefore, newLines: newLinesBefore, lineOffset }));
        diff.push(...lines({
            oldLines: oldLinesAfter, newLines: newLinesAfter, lineOffset: lineOffset + oldEnd,
        }));
    }

    return diff;
};
lines.common = ({ oldLines, newLines }) => {
    const lineNumbers = [];

    if (oldLines.length === 0 || newLines.length === 0)
        return lineNumbers;

    if (newLines.join('\n').includes(oldLines.join('\n'))) {
        lineNumbers.push(0, oldLines.length);
        return lineNumbers;
    }

    // Try groups of lines with one less line until one exists within the newLines
    for (let lineGroupLength = oldLines.length - 1; lineGroupLength > 0; lineGroupLength--) {
        for (let lineNumber = 0; lineNumber <= oldLines.length - lineGroupLength; lineNumber++) {
            const lines = oldLines.slice(lineNumber, lineNumber + lineGroupLength);

            if (newLines.join('\n').includes(lines.join('\n'))) {
                lineNumbers.push(lineNumber, lineNumber + lineGroupLength);
                return lineNumbers;
            }
        }
    }

    return lineNumbers;
};

module.exports = {
    lines,
};