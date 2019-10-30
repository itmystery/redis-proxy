process.env.NODE_ENV = 'test';

const chai = require('chai');
//const chai_promise = require('chai-as-promised');
//chai.use(chai_promise);
const parallel = require('mocha.parallel');

chai.should();

const net = require('net');
const resp = require('resp');
const Redis = require('ioredis');

const app = require('../app');
const config = require('../config/config');

const redisOprions = {
    host: config.get('db.host'),
    port: config.get('db.port'),
};

const proxyPort = config.get('port');
const proxyHost = config.get('host');

const client = new Redis(redisOprions);

const createConnection = async (port, host) => {
    return new Promise(resolve => {
        let socket = net.createConnection(port, host, () => {
            resolve(socket);
        })
    })
}

const closeSocket = async (socket) => {
    return new Promise(resolve => {
        socket.end();
        socket.once('end', () => {
            resolve()
        });
    })
}

const sendGetWithResponse = async (socket, key) => {
    return new Promise((resolve, reject) => {
        socket.once('data', (data) => {
             resolve(resp.parse(data.toString()));
             socket.removeAllListeners('data');
        });
        socket.once('error', (data) => {
            reject(data);
            socket.removeAllListeners('data');
        });
        socket.write(resp.stringify(['get', key]));
        
    })
}

parallel.skip("HTTP web service", () => {

})

describe('Single backing instance', () => {
    let monitor = null;
    let monitorCommands = [];
    let keyPrefix = "test2_key";
    let valPrefix = "test2_value";
    let repeats = 3;

    before(async function() {
        monitor = await client.monitor();
        monitor.on('monitor', (time, args, source, database) => {
            monitorCommands.push(args);
        });
        
        for (let i = 1; i <= repeats; i++) {
            await client.set(keyPrefix+i, valPrefix+i);
        }
    });

    after(async function() {
        monitor.disconnect();
        for (let i = 1; i <= repeats; i++) {
            await client.del(keyPrefix+i);
        }
    })

    parallel("Set values in single redis db and send parallel GET command from different clients to proxy", function() {
    
        for (let i = 1; i <= 3; i++) {
            it("should return value that equal set value for "+i+" client", async function() {
                let socket = await createConnection(proxyPort, proxyHost);
                let response = await sendGetWithResponse(socket, keyPrefix+i);
                response.should.equal(valPrefix+i);  
                await closeSocket(socket);   
            })
        }
    })

    it("redis db log should contain count of commands equal count of sent commands", function() {
        monitorCommands.length.should.be.equal(repeats);
    })
})

describe("Cached get", function() {
    let socket = null;
    let monitor = null;
    let monitorCommands = []
    let key = "test3_key1";
    let value = "test3_value1";
    let repeats = 5;

    before(async function() {
        await client.set(key, value);

        monitor = await client.monitor();
        monitor.on('monitor', (time, args, source, database) => {
            monitorCommands.push(args);
        });

        socket = await createConnection(proxyPort, proxyHost);


        for(let i = 0; i < repeats; i++) {
            let resp = await sendGetWithResponse(socket, key);
        }
    });

    after(async function() {
        monitor.disconnect();
        await closeSocket(socket);
        await client.del(key);
    })



    it("redis log should contain only one record after sending "+repeats+" requests", function() {
        monitorCommands.length.should.be.equal(1);
        monitorCommands[0].should.be.deep.equal(["get", key]);
    })
})

describe('Global expiry', function() {
    
    let socket = null;
    let key = 'test4_key1';
    let firstValue = 'test4_value1';
    let secondValue = 'test4_value2';
    let monitor = null;
    let monitorCommands = []

    before(async function() {
        socket = await createConnection(proxyPort, proxyHost); 
        await client.set(key, firstValue);

        monitor = await client.monitor();
        monitor.on('monitor', (time, args, source, database) => {
            monitorCommands.push(args);
        });
    });

    after(async function() {
        await client.del(key);
        await closeSocket(socket);
    })

    it("should return first value from redis db", async function() {
        let resp = await sendGetWithResponse(socket, key);
        resp.should.equal(firstValue);
    });

    it("set new value to db, but it should return old value from cache", async function() {
        await client.set(key, secondValue);
        let resp = await sendGetWithResponse(socket, key);
        resp.should.equal(firstValue);
    });

    
    it("waiting time expire and it should return second value from db", function(done) {
        setTimeout(() => {
            sendGetWithResponse(socket, key)
            .then((resp) => {
                resp.should.equal(secondValue);
                done();
            });
        }, 500);
    });

    it("redis log should contain only two get operations", function() {
        monitorCommands.length.should.be.equal(3);
        monitorCommands[0].should.be.deep.equal(["get", key]);
        monitorCommands[2].should.be.deep.equal(["get", key]);
    })

});

describe('LRU eviction', function() {
    let socket = null;
    let monitor = null;
    let monitorCommands = []
    let keyPrefix = "test5_key";
    let valPrefix = "test5_value";
    let repeats = 11;

    before(async function() {
        socket = await createConnection(proxyPort, proxyHost);
        socket.setMaxListeners(22);

        for (let i = 1; i <= repeats; i++) {
            await client.set(keyPrefix+i, valPrefix+i);
            await sendGetWithResponse(socket, keyPrefix+i);
        }

        monitor = await client.monitor();
        monitor.on('monitor', (time, args, source, database) => {
            monitorCommands.push(args);
        });
    });

    after(async function() {
        monitor.disconnect();
        await closeSocket(socket);
        for (let i = 1; i <= repeats-1; i++) {
            await client.del(keyPrefix+i);
        }
    });

    for (let i = repeats; i >= 1  ; i--) {
        it("getting value " +i+ " from proxy redis", async function() {
            let resp = await sendGetWithResponse(socket, keyPrefix+i);
            resp.should.equal(valPrefix+i);
        });
    }

    it("redis log should contain 1 get commands and be equal request first value", function() {
        monitorCommands.length.should.be.equal(1);
        monitorCommands[0].should.be.deep.equal(["get", keyPrefix+1]);
    })

});

parallel.skip("Fixed key size", function() {

})

parallel('Parallel concurrent processing', function() {
    let sockets = [];
    let keyPrefix = "test7_key";
    let valPrefix = "test7_value";
    
    before(async function() {
        for (let i = 1; i <= 20; i++) {
            await client.set(keyPrefix+i, valPrefix+i);
        }
    });

    after(async function() {
        for (let i = 1; i <= 20; i++) {
            await client.del(keyPrefix+i);
        }

        for (let socket of sockets) {
            await closeSocket(socket);
        }
    });

    for (let i = 1; i <= 10; i++) {
        it("should execute command parallel and return "+i+" value before 1000ms pause redis db"+i, async function() {
            this.timeout(1000);
            let socket = await createConnection(proxyPort, proxyHost); 
            let res = await sendGetWithResponse(socket, keyPrefix+i);
            res.should.equal(valPrefix+i);

            //set pause to redis instance after getting response for first client
            if (res === valPrefix+1) {
                client.client('PAUSE', 1000);
            }

            sockets.push(socket);
        })
    }

    for (let i = 11; i <= 15; i++) {
        it("should execute command parallel and return "+i+" value after 1000ms pause redis db "+i, async function() {
            let socket = await createConnection(proxyPort, proxyHost); 
            let res = await sendGetWithResponse(socket, keyPrefix+i);
            res.should.equal(valPrefix+i);

            sockets.push(socket);
        })
    }

    // for (let i = 16; i <= 20; i++) {
    //     it("get value from db "+i, function() {
    //         return createConnection(proxyPort, proxyHost)
    //         .then(socket => sendGetWithResponse(socket, "test7_key"+i))
    //         .should.be.rejected;
    //     })
    // }

});

describe("Redis client protocol", function() {
    let socketRedis = null;
    let socketProxy = null;
    let key = "test8_key1";
    let val = "test8_value1";


    before(async function() {
        await client.set(key, val);
        socketRedis = await createConnection(redisOprions.port, redisOprions.host);
        socketProxy = await createConnection(proxyPort, proxyHost);  
    })

    after(async function() {
        await closeSocket(socketRedis);
        await closeSocket(socketProxy);
        await client.del(key);
    })

    it("should return same response from proxy and redis instance", async function() {
        let redisResponse = await sendGetWithResponse(socketRedis, key);
        let proxyResponse = await sendGetWithResponse(socketProxy, key);
        redisResponse.should.equal(proxyResponse);
    });

})


