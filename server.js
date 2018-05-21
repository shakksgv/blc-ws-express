const express = require('express');
const router = express.Router();
const blc = require('broken-link-checker');

const app = express();

router.get('/status', function(req, res) {
    res.json({ status: 'App is running!' });
});

app.use("/", router);
app.use(express.static('dist'));

const server = app.listen(8080);
const io = require('socket.io')(server);

let links = [];
let url = '';

io.on('connection', function (socket) {
    socket.emit('blc-status', { url, links });

    socket.on('blc', req => {
        if (this.url) {
            return;
        }

        const siteChecker = new blc.SiteChecker({
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
                            links: [link],
                            total: 0
                        });
                    } else {
                        links.find(el => el.source === source).links.push(link);
                    }

                    io.sockets.emit('blc-response', source, link);
                }
            }
        });

        url = req;        
        siteChecker.enqueue(url);
    });
});