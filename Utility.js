function isNil (value) {
    return value == null;
}

function hasLeadingOrTrailingWhiteSpace (value) {
    return value !== value.trim();
}

module.exports = {
    isNil,
    hasLeadingOrTrailingWhiteSpace,
};