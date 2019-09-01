const JSZip = require('jszip');

async function unzip (file) {
    const zip = await JSZip.loadAsync(file);
    return {
        get directories () {
            return this.files
                .reduce((directories, file) => {
                    const dirPath = file.split('/');
                    dirPath.pop();
                    const directory = dirPath.join('/');

                    if (directory) {
                        const exists = directories.find(dir => dir === directory);
                        if (!exists)
                            directories.push(directory);
                    }

                    return directories;
                }, [])
                .sort((a, b) => a.length - b.length);
        },
        get files () {
            return Object.entries(zip.files)
                .filter(([ , file ]) => !file.dir)
                .map(([ fileName ]) => fileName);
        },
        read: async function (filePath) {
            return await zip.file(filePath).async('string');
        },
    };
}

const Zip = {
    unzip,
};

module.exports = Zip;