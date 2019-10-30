const yargs = require('yargs');

const argv = yargs
    .option('type', {
        description: 'Server type http/resp',
        type: 'string',
    })
    .option('db-host', {
        description: 'Host name/IP of the backing Redis',
        type: 'string',
    })
    .option('db-port', {
        description: 'Port of the backing Redis',
        type: 'string',
    })
    .option('ttl', {
        description: 'Cache expiry time, ms',
        type: 'number',
    })
    .option('keys', {
        description: 'Cache capacity (number of keys)',
        type: 'number',
    })
    .option('port', {
        description: 'TCP/IP port number the proxy listens on',
        type: 'number',
    })
    .option('host', {
        description: 'Server host name/IP',
        type: 'number',
    })
    .option('queue', {
        description: 'Max parallel requests to redis db',
        type: 'number',
    })
    .option('max-conn', {
        description: 'Maximum proxy client connections',
        type: 'number',
    })
    .help()
    .alias('help', 'h')
    .argv;

