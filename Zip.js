const JSZip = require('jszip');

async function unzip (file) {
    const zip = await JSZip.loadAsync(file);
    return {
        directories: Object.entries(zip.files)
            .filter(([ , file ]) => file.dir)
            .map(([ fileName ]) => fileName),
        files: Object.entries(zip.files)
            .filter(([ , file ]) => !file.dir)
            .map(([ fileName ]) => fileName),
        read: async function (filePath) {
            return await zip.file(filePath).async('string');
        },
    };
}

const Zip = {
    unzip,
};

module.exports = Zip;