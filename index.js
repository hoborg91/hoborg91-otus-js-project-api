const express = require('express');
const cors = require('cors');
const db = require('./poorManDb');

const bodyParser = require('body-parser');

const documentsArray = db.loadDocumentsAsArray();
const documentsDictionary = {};
documentsArray.forEach(document => {
    if (document.userFriendlyId)
        documentsDictionary[document.userFriendlyId] = document;
});

const commentsArray = db.loadCommentsAsArray();
const commentsDictionary = {};
commentsArray.forEach(comment => {
    if (!commentsDictionary[comment.userFriendlyId])
        commentsDictionary[comment.userFriendlyId] = [];
    commentsDictionary[comment.userFriendlyId].push(comment);
});

const app = express();
const port = 3000;
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
<html>
    <body>
        <form method="post" action="document">
            userFriendlyId<br />
            <textarea name="userFriendlyId"></textarea><br />
            caption<br />
            <textarea name="caption"></textarea><br />
            text<br />
            <textarea name="text"></textarea><br />
            password<br />
            <input type="password" name="password" />
            <br />
            <button type="submit">Submit</button>
        </form>
    </body>
</html>
    `);
});

app.get('/document', (req, res) => {
    if (req.query.id === null || req.query.id === undefined) {
        res.set('Content-Type', 'application/json');
        const captionToSearch = req.query.captionToSearch === null || req.query.captionToSearch === undefined
            ? null
            : req.query.captionToSearch.toLowerCase();
        if (captionToSearch.length <= 1) {
            res.send({ captionToSearch: req.query.captionToSearch, message: 'The given search string is too small.', documents: [] });
            return;
        }
        res.send({ captionToSearch: req.query.captionToSearch, message: null, documents: documentsArray
            .filter(d => captionToSearch === null || d.caption.toLowerCase().indexOf(captionToSearch) >= 0)
            .filter((d, i) => i < 10)
            .map(({ userFriendlyId, caption, otherVersions }) => ({ userFriendlyId, caption, otherVersions }))
        });
        return;
    }
    const document = documentsDictionary[req.query.id];
    if (document) {
        res.set('Content-Type', 'application/json');
        res.send(documentsDictionary[req.query.id]);
    } else {
        res.status(404).end();
    }
});

app.post('/document', (req, res) => {
    if (req.body.password !== 'otus-javascript') {
        res.status(403).end();
    }
    const document = {
        "userFriendlyId": req.body.userFriendlyId,
        "text": req.body.text,
        "caption": req.body.caption,
    };
    if (documentsDictionary[document.userFriendlyId]) {
        res.status(409).end();
    } else {
        documentsArray.push(document);
        documentsDictionary[document.userFriendlyId] = document;
        db.saveDocument(document);
        res.status(201).end();
    }
});

app.get('/comment', (req, res) => {
    res.set('Content-Type', 'application/json');
    res.send(commentsDictionary[req.body.docId]);
});

app.post('/comment', (req, res) => {
    if (req.body.password !== 'otus-javascript') {
        res.status(403).end();
    }
    const comment = {
        "userFriendlyId": req.body.userFriendlyId,
        "author": req.body.author,
        "text": req.body.text,
        "when": new Date(),
    };
    commentsArray.push(document);
    if (!commentsDictionary[comment.userFriendlyId])
        commentsDictionary[comment.userFriendlyId] = [];
    commentsDictionary[comment.userFriendlyId].push(comment);
    db.saveComment(comment);
    res.status(201).end();
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});