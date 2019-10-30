const http = require('http');
const {StringDecoder} = require('string_decoder');


class HttpProxyRedis {
    _proxyRedis = null;
    _decoder = new StringDecoder('utf8');

    constructor(proxyRedis, options, cb) {
        this._proxyRedis = proxyRedis;
        this._initServer(options, cb);
    };

    _initServer(options, cb) {    
        this._server = http.createServer((req, res) => {
            this._toRedisCommand(req)
            .then(command => this._proxyRedis.sendCommand(command))
            .then(answer => {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(this._toClientResponse(answer));
                res.end();
            })
            .catch(err => {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.write(this._toClientError(err.message));
                res.end();
            })
        });

        if(options.maxConnections) {
            this._server.maxConnections = options.maxConnections;
        }

        this._server.listen(options.port, cb); 
    };

    _toClientResponse(redisResponse) {
        return redisResponse ? redisResponse : "null";
    }

    _toClientError(redisError) {
        return redisError;
    }

    _toRedisCommand(clientRequest) {
        return new Promise((resolve, reject) => {
            let url = clientRequest.url.slice(1);
            if (clientRequest.method === 'GET' && url) {
                resolve(['get', url]);
            } else {
                reject(new Error("Only get method supports with key"));
            }
        })

    }
}

module.exports = HttpProxyRedis;
