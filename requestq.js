(function() {
    var http = require('http'),
        https = require('https'),

        // queue up a number of async requests.
        // execute a callback for each request.
        // when they are all complete, execute a done callback
        RequestQueue = function(done) {
            var queue = [];

            this.enqueue = function(uri, cb, https) {
                queue.push({
                    uri: uri,
                    cb: cb,
                    https: https
                });
            }

            this.start = function() {
                var self = this;
                setTimeout(function() {
                    self.dequeue()
                }, 0);
            }

            this.dequeue = function() {
                var next = queue.shift(),
                    self = this;

                if (!next) return;

                this.getHttp(next.uri, function(data) {
                    next.cb(data);
                    // if the queue is empty, done()
                    if (!queue.length) {
                        done();
                    } else {
                        // otherwise, timer, dequeue
                        setTimeout(function() {
                            self.dequeue();
                        }, 0);
                    }
                }, next.https);
            }
        }

    // assemble chunks of data into complete response body, let controller fn know we're done
    RequestQueue.prototype.getHttp = function(url, done, usehttps) {
        var protocol = usehttps ? https : http;
        protocol.get(url, function(res) {
            var concatdata = '';
            res.setEncoding('utf8');
            res.on('data', function (data) {
                concatdata += data;
            });
            res.on('end', function() {
                done(concatdata);
            });
        }).on('error', function(e) {
            // @todo should do something with error response
            console.log(JSON.stringify(e));
        });
    }

    module.exports = RequestQueue;
})();
