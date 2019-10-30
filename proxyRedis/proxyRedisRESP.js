const net = require('net');
const resp = require('resp');
const { StringDecoder } = require('string_decoder');

class ProxyRedisResp {
 
    constructor(proxyRedis, options, cb) {
        this._proxyRedis = proxyRedis;
        this._initServer(options, cb);
        this._decoder = new StringDecoder('utf8');
    };

    _initServer(options, cb) {
        this._server = net.createServer((c) => {
            c.on('data', (data) => {
                this._toRedisRequest(data)
                .then(req => this._proxyRedis.sendCommand(req))
                .then(res => c.write(this._toClientResponse(res)))
                .catch(err => c.write(this._toClientError(err)))
            })
        });

        if(options.maxConnections) {
            this._server.maxConnections = options.maxConnections;
        }

        this._server.on('error', (err) => {
            console.error(err);
        });
          
        this._server.listen(options.port, cb);
    }

    _toClientResponse(redisResponse) {
        return resp.stringify(redisResponse);
    }

    _toClientError(redisError) {
        return resp.stringify(redisError);
    }

    _toRedisRequest(serverRequest) {
        return new Promise((resolve, reject) => {
            try {
                let redisRequest = resp.parse(this._decoder.write(serverRequest));
                if (Array.isArray(redisRequest)) {
                   redisRequest[0] = redisRequest[0].toLowerCase();
                }
                resolve(redisRequest);    
            } catch (error) {
                reject(error);
            }
        })
    }
}

module.exports = ProxyRedisResp;
