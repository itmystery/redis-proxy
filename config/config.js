require('dotenv').config();
const convict = require('convict');

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['prod', 'dev', 'test'],
    default: 'dev',
    env: 'NODE_ENV'
  },
  type: {
    doc: 'Server type protocol http/resp',
    format: '*',
    default: 'resp',
    arg: 'type',
    env: 'TYPE',
  },
  maxQueue: {
    doc: 'Max parallel requests to a proxy redis db',
    format: 'int',
    default: 20,
    arg: 'queue',
    env: 'QUEUE',
  },
  maxConnections: {
    doc: 'Maximum proxy client connections',
    format: '*',
    default: 100,
    arg: 'max-conn',
    env: 'MAX_CONN',
  },
  port: {
    doc: 'TCP/IP port number a proxy listens on',
    format: 'port',
    default: 6389,
    env: 'PORT',
    arg: 'port'
  },
  host: {
    doc: 'Server host name/IP',
    format: '*',
    default: 'localhost',
    env: 'HOST',
    arg: 'host'
  },
  caching: {
      ttl: {
        doc: 'Cache expiry time, ms',
        format: 'int',
        default: 3600000,
        env: 'TTL',
        arg: 'ttl',
      },
      maxKeys: {
        doc: 'Cache capacity (number of keys)',
        format: 'int',
        default: 1000,
        env: 'KEYS',
        arg: 'keys',
      },
  },
  db: {
    host: {
      doc: 'Host name/IP of a backing Redis',
      format: '*',
      default: 'localhost',
      env: 'DB_HOST',
      arg: 'db-host'
    },
    port: {
        doc: 'Port number of a backing Redis',
        format: 'port',
        default: 6379,
        env: 'DB_PORT',
        arg: 'db-port'
      },
  }
});

const env = config.get('env');
config.loadFile(`./config/${env}.json`);

// Perform validation
config.validate({allowed: 'strict'});

module.exports = config;