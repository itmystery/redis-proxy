const CacheManager = require('lru-cache');

class RedisCashing {
    _cashingCommands = ['get'];
    _cacheManager = null;

    constructor(opts) {
        if (!opts) opts = {};

        if (opts.commands) {
            this._cashingCommands = opts.commands;
        }

        let cacheOpt = {}
        if (opts.maxKeys) cacheOpt.max = opts.maxKeys; 
        if (opts.ttl) cacheOpt.maxAge = opts.ttl;

        this._cacheManager = new CacheManager(cacheOpt);
    }

    get(command) {
        return Promise.resolve(this._cacheManager.get(this._getKey(command)));
    }

    set(command, value) {
        return new Promise((resolve, reject) => {
            if (this._cacheManager.set(this._getKey(command), value)) {
                resolve(value);
            }
            else {
                reject(new Error("Can't save value in cache!"));
            }
        })
    }

    _isCashingCommand(command) {
        return this._cashingCommands.includes(this._getCommand(command));    
    }

    _getCommand(command) {
        return command[0];
    }

    _getKey(command) {
        return command.join('_');
    }

}

module.exports = RedisCashing;