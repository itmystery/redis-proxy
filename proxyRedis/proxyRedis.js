const RedisParallelExecutor = require('./redisParallelExecutor');
const RedisCaching = require('./redisCaching');

class ProxyRedis {
    _redisExecutor = null;
    _cache = null;

    constructor(opts) {
        this._redisExecutor = new RedisParallelExecutor(opts);
        this._cache = new RedisCaching(opts);
    }

    _getResultFromCache(command) {
        return this._cache.get(command);
    }

    _saveResultInCache(command, value) {
        return this._cache.set(command, value);
    }

    _getResultFromRedis(command) {
        return this._redisExecutor.execute(command);
    }

    sendCommand(command) {
        return this._getResultFromCache(command)
            .then(value => value ? value : this._getResultFromRedis(command)
                .then(value => this._saveResultInCache(command, value)))     
    }
}

module.exports = ProxyRedis;

