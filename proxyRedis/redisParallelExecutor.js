const {Duplex} = require('stream');
const Redis = require('ioredis');

class RedisParallelExecutor extends Duplex {
    _redisClient = null;
    _commands = [];

    constructor(opts) {
        super({readableObjectMode: true, writableObjectMode: true, writableHighWaterMark: opts.maxQueue});
        this._redisClient = new Redis(opts);
        this.pipe(this);
    }

    execute(command, callback) {
        if (callback) {
            let commandWithCallBack = [...command, callback];
            this.push(commandWithCallBack);
            return;
        }
        else {
            return new Promise((resolve, reject) => {
                
                //add callback in ioredis command
                let commandWithCallBack = [...command];
                commandWithCallBack.push((err, res) => {
                    if (err) 
                        reject(err);
                    else
                        resolve(res);
                })

                this.push(commandWithCallBack);
            });
        }
    }

    _sendCommand(next) {
        this._redisClient.pipeline(this._commands).exec((err, values) => {
            this._clear();
            process.nextTick(() => this.uncork());        
            next();   
        });
    }

    _combine(command) {
        this._commands.push(command);
    }

    _clear() {
        this._commands = [];
    }

    __write(commands, next) {
        this.cork();
        for (let command of commands) {
            this._combine(command);
        }
        this._sendCommand(next);
    }
    
    _write = (command, enc, next) => {
        this.__write([command], next);
    };

    _writev = (commands, next) => {
        this.__write(commands.map((val) => val.chunk), next);
    }
    
    _read = () => {};
}

module.exports = RedisParallelExecutor;