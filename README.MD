# Redis Proxy

Transparent Redis proxy service via HTTP or RESP which allows the ability to add additional features on top of Redis.

## High-level architecture overview

The code provides several classes, each performs the task assigned to it. The proxy server can be expanded with additional functionality. The proxy implementation is made in a separate class that can be used to process requests through various protocols or directly from the code.

### RedisCaching Class

This class uses lru-cache and provide cache operations for Redis commands. Commands for caching can be configured.

### RedisParallelExecutor Class

This class uses the ioredis library for communication with Redis DB via Redis protocol(RESP). It extends the Duplex Stream class. Readable stream buffer uses for collection requests from clients. Writable stream uses the Redis pipeline for sending a bunch of requests to the Redis for parallel executing.

### ProxyRedis Class

This class combines the RedisCaching and the RedisParallelExecutor classes. It has one public method - sendCommand. 
This method tries to get a result from the cache and if it missing sends a command to Redis instance and writes the result in the cache if it is applicable.

### ProxyRedisHTTP Class

This class provides communication with a proxy Redis DB instance via HTTP. 

### ProxyRedisRESP Class

This class provides communication with a proxy Redis DB instance via Redis protocol (RESP). 

## What the code does

* Raises up HTTP or RESP server according configuration parameters еhat provide communication beetween client and a redis db.
* Caches GET request using LRU cache algorithm.
* Combines requests from different clients in one bunch of requests using redis pipline.

## Algorithmic complexity of the cache operations

The lru-cache library uses a dictionary for storing key/values pairs and a doubly-linked list for acceleration writing operations.

* Getting operations - O(1)
* Putting operations - O(1)
* Memory - O(n)

## Instructions for how to run the proxy and tests

Unpucking distributive

```
git clone
tar -xzvf assignment.tar.gz
cd assignment
```

### Running the tests

For running tests the system should have the following software installed:
*make
*docker
*docker-compose
*Bash

`make test` create two docker containers with a redis-proxy server and a redis db.
Complete test using mocha framevork and remove all test containers and images at the end.

```
make test
```

### Deploying in docker container

For deployment in the docker use `make` for bulding docker image with name 'redis-proxy'.
You can use environment variables for configuration redis-proxy. Avaliable parameters see below.
You can start a new container using the `docker run` command for starting container with a redis-proxy server.

Example:
```
make
docker run --name redis-proxy -e DB_HOST=redis -e TTL=10000 -e KEYS=100 -e MAX_CONN=5 -e QUEUE=1 -p 6379:6379 -e PORT=6379  -e TYPE=resp --link redis-test:redis redis-proxy
```

Or you can use `make run`" command for starting a container with default params.
Use `make remove` for removing the image."

### Deploying on NodeJS server

Example:
```
node app.js --db-host redis ttl 10000 --keys=100 --queue 1 --port 6379 --type resp
```

### Configuration parameters

| Parameter  | ENV | default | Description |
| --- | --- | --- | --- |
| `--type` | TYPE | resp | Server type protocol http/resp |
| `--port` | PORT | 6389 | TCP/IP port number a proxy listens on |
| `--db-host` | DB_HOST | redis | Host name/IP of a backing Redis |
| `--db-port` | DB_PORT | 6379 | Port number of a backing Redis |
| `--max-conn` | MAX_CONN | 100 | Maximum proxy client connections |
| `--queue` | QUEUE | 20 | Maximum proxy client connections |
| `--ttl` | TTL | 3600000 | Cache expiry time, ms |
| `--keys` | KEYS | 1000 | Cache capacity (number of keys) |

## Time spent

* HTTP web service - 1 hour
* Single backing instance - 1 hour
* Cached GET - 1 hour
* Global expiry - 30 min
* LRU eviction - 30 min
* Fixed key size - 30 min
* Sequential concurrent processing - 2 hours
* Configuration - 2 hours
* System tests - 8 hours
* Platform - 4 hours
* Single-click build and test - 4 hours
* Documentation - 4 hours
* Parallel concurrent processing - 6 hours
* Redis client protocol - 4 hours

## Not implemented requerments

All requerments have been implemented.