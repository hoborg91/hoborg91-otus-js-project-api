const fs = require('fs');

const pathToData = 'data';
const pathToDocuments = `${pathToData}/documents`;
const pathToDocMeta = `${pathToData}/docMeta`;

const docMetas = fs.readdirSync(pathToDocMeta).map(fileName =>
    JSON.parse(fs.readFileSync(`${pathToDocMeta}/${fileName}`)));

module.exports = {
    loadDocumentsAsArray: function() {
        const fileNames = fs.readdirSync(pathToDocuments);
        const result = fileNames.map(fileName => {
            const document = JSON.parse(fs.readFileSync(`${pathToDocuments}/${fileName}`, 'utf8'));
            const versions = docMetas
                .filter(docMeta => docMeta.versions
                    .filter(v => v.userFriendlyId === document.userFriendlyId)
                    .length > 0
                )
                .map(docMeta => docMeta.versions)
                .reduce((a, b) => a.concat(b), [])
                .filter(version => version.userFriendlyId !== document.userFriendlyId);
            document.otherVersions = versions;
            return document;
        });
        result.forEach(document => {
            document.otherVersions.forEach(version => {
                version.caption = result
                    .filter(d => d.userFriendlyId === version.userFriendlyId)[0]
                    .caption;
            });
        });
        return result;
    },
    saveDocument: function(document) {
        const fileName = `${document.userFriendlyId}.json`;
        const fileNames = fs.readdirSync(pathToDocuments);
        if (fileNames.indexOf(fileName) >= 0 || fileNames.length > 100)
            return false;
        fs.writeFileSync(`${pathToDocuments}/${document.userFriendlyId}.json`, JSON.stringify(document));
        return true;
    },
    loadCommentsAsArray: function() {
        const comments = JSON.parse(fs.readFileSync(`data/comments.json`, 'utf8'));
        return comments;
    },
    saveComment: function(comment) {
        const comments = JSON.parse(fs.readFileSync(`data/comments.json`, 'utf8'));
        comments.push(comment);
        fs.writeFileSync(`data/comments.json`, JSON.stringify(comments));
    }
}
