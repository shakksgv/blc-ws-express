const express = require('express');
const router = express.Router();
const blc = require('broken-link-checker');

const PORT = process.env.PORT || 5000;
const app = express();

router.get('/status', function(req, res) {
    res.json({ status: 'App is running!' });
});

app.use("/", router);
app.use(express.static('dist'));

const server = app.listen(PORT);
const io = require('socket.io')(server);

let siteChecker = createBLC();
let links = [];
let url = '';

io.on('connection', function (socket) {
    socket.emit('blc-status', { url, links });

    socket.on('blc', req => {
        if (!this.url) {
            url = req;        
            siteChecker.enqueue(url);
        }
    });

    socket.on('blc-cancel', () => {
        siteChecker.pause();
        siteChecker = createBLC();
    });
});

function createBLC() {
    return new blc.SiteChecker({
        excludeExternalLinks: true,
        excludedKeywords: [
            '/us-es',
            '?change_lang'
        ]
    }, {
        link(result) {
            if (!result.http.cached) {
                const source = result.base.original;
                const link = {
                    href: result.url.original,
                    status: !result.broken
                };

                if (!links.some(el => el.source === source)) {
                    io.sockets.emit('blc-new-group', source);
                    links.push({
                        source,
                        links: [link]
                    });
                } else {
                    links.find(el => el.source === source).links.push(link);
                }

                io.sockets.emit('blc-response', source, link);
            }
        },
        site() {
            url = '';
            links = [];
            siteChecker = createBLC();
        }
    });
}
