const { ProxyRedisHTTP, ProxyRedisRESP, ProxyRedis } = require('./proxyRedis');
const config = require('./config/config');
const yargs = require('./config/yargs');

const proxyOptions = {
    host: config.get('db.host'),
    port: config.get('db.port'),
    maxQueue: config.get('maxQueue'),
    ttl: config.get('caching.ttl'),
    maxKeys: config.get('caching.maxKeys'),
};

const proxyRedis = new ProxyRedis(proxyOptions);

const serverOptions = {
    port: config.get('port'),
    maxConnections: config.get('maxConnections')
}

let server = null;
if (config.get('type') === 'http') {
    server = new ProxyRedisHTTP(proxyRedis, serverOptions, () => {
        console.log(`HTTP server running with next options: 
            ${JSON.stringify(proxyOptions)}
            ${JSON.stringify(serverOptions)}`);
    });
} 
else {
    server = new ProxyRedisRESP(proxyRedis, serverOptions, () => {
        console.log(`RESP server running with next options: 
            ${JSON.stringify(proxyOptions)}
            ${JSON.stringify(serverOptions)}`);
    });
}