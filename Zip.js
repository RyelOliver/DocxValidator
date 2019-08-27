const JSZip = require('jszip');

async function unzip (file) {
    const zip = await JSZip.loadAsync(file);
    return {
        files: Object.keys(zip.files),
        read: async function (filePath) {
            return await zip.file(filePath).async('string');
        },
    };
}

const Zip = {
    unzip,
};

module.exports = Zip;