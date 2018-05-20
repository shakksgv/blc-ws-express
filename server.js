const express = require('express');
const router = express.Router();
const blc = require('broken-link-checker');

const app = express();

router.get('/status', function(req, res) {
    res.json({ status: 'App is running!' });
});

app.use("/", router);
app.use(express.static('dist'))

const server = app.listen(8080);
const io = require('socket.io')(server);

let links = {};
let url = '';

io.on('connection', function (socket) {
    socket.emit('blc-status', { url, links });

    socket.on('blc', req => {
        const siteChecker = new blc.SiteChecker({
            excludeExternalLinks: true,
            excludedKeywords: [
                '/us-es',
                '?change_lang'
            ]
        }, {
            link(result) {
                const source = result.base.original.replace(url, '/');
                const link = {
                    href: result.url.original,
                    status: !result.broken
                };

                io.sockets.emit('blc-response', source, link);
                
                if (!links.hasOwnProperty(source)) {
                    links[source] = [];
                }

                links[source].push(link);
            }
        });

        url = req;        
        siteChecker.enqueue(url);
    });
});