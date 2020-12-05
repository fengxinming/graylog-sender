'use strict';

const nodePool = require('generic-pool');
const dgram = require('dgram');
const Console = require('clrsole');

const defaultLogger = new Console('UDPPool');

const defaultPool = {
  min: 2,
  max: 10
};

class UDPPool {

  /**
   * 创建udp4连接池
   * @param {Object} options
   */
  constructor(options = {}) {
    const logger = this.logger = options.logger || defaultLogger;
    this.pool = nodePool.createPool({
      create() {
        return new Promise((resolve, reject) => {
          const client = dgram.createSocket('udp4');
          client.on('error', (err) => {
            logger.error(err);
            reject(err);
          });
          logger.info('created socket udp4');
          resolve(client);
        });
      },
      destroy(client) {
        return new Promise((resolve) => {
          client.on('close', (err) => {
            if (err) {
              logger.error(err);
            }
            logger.info('closed socket udp4');
            resolve();
          });
          client.close();
        });
      }
    }, Object.assign({}, defaultPool, options));
  }

  getConnection(priority) {
    return this.pool.acquire(priority);
  }

  release(client) {
    return this.pool.release(client);
  }

  destroy(client) {
    return this.pool.destroy(client);
  }

  end() {
    return this.pool.drain()
      .then(() => this.pool.clear())
      .then((res) => {
        this.logger.info('ended all UDP connections');
        return res;
      });
  }

}

module.exports = UDPPool;
