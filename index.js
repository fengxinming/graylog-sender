'use strict';

const assert = require('assert').strict;
const Console = require('clrsole');
const localIP = require('./lib/local-IP');
const UDPPool = require('./lib/UDPPool');
const graylogLayout = require('./lib/layout');

const CHUNK_MAX_BYTES = 1420;
const defaultLogger = new Console('GraylogSender');

class GraylogSender {

  constructor({ host, chunkMaxBytes }) {
    this.setHost(host);
    this.chunkMaxBytes = chunkMaxBytes || CHUNK_MAX_BYTES;
    this.pool = new UDPPool();
  }

  /**
   * 设置host
   * @param {String|Array} host
   */
  setHost(host) {
    assert.ok(!!host, 'Must have a property "host"');
    if (!Array.isArray(host)) {
      host = [host];
    }
    this.remotes = host.map(h => h.split(':'));
    this.remoteSize = this.remotes.length;
  }

  /**
   * 随机获取graylog服务器信息
   */
  getRemote() {
    const { remotes, remoteSize } = this;
    return remoteSize === 1 ? remotes[0] : remotes[Math.floor(Math.random() * remoteSize)];
  }

  /**
   * 发送消息到graylog服务器
   * @param {Buffer} buffer
   * @param {Number} offset
   * @param {Number} len
   */
  async sendChunk(buffer, offset, len) {
    const { pool } = this;
    const client = await pool.getConnection();
    return new Promise((resolve, reject) => {
      const [hostname, port] = this.getRemote();
      client.send(buffer, offset, len, port, hostname, (err) => {
        if (err) {
          defaultLogger.error('Sent message failed: ', err);
          pool.destroy(client);
          reject(err);
        } else {
          pool.release(client);
          resolve();
        }
      });
    });
  }

  /**
   * 发送buffer到服务端
   * sender.sendBuffer( buffer ).catch( (e) => ...)
   * @param {Buffer} buffer
   */
  sendBuffer(buffer) {
    const len = buffer.length;
    const { chunkMaxBytes } = this;
    if (len <= chunkMaxBytes) {
      return this.sendChunk(buffer, 0, len);
    } else {
      let chunksCount = Math.ceil(len / chunkMaxBytes);
      if (chunksCount > 128) {
        chunksCount = 128;
      }
      const messageId = `${localIP}-${Date.now() + Math.floor(Math.random() * 10000)}`;
      let byteOffset = 0;
      const promises = [];
      for (let i = 0; i < chunksCount; i++) {
        const chunkBytes = (byteOffset + chunkMaxBytes) < len ? chunkMaxBytes : (len - byteOffset);
        const chunk = Buffer.alloc(chunkBytes + 12);
        chunk[0] = 0x1e;
        chunk[1] = 0x0f;
        chunk.write(messageId, 2, 8, 'ascii');
        chunk[10] = i;
        chunk[11] = chunksCount;
        buffer.copy(chunk, 12, byteOffset, byteOffset + chunkBytes);
        byteOffset += chunkBytes;
        promises[promises.length] = this.sendChunk(chunk, 0, chunk.length);
      }
      return Promise.all(promises);
    }
  }

  /**
   * 发送字符串到服务端
   * sender.send( str ).catch( (e) => ...)
   * @param {String} str
   */
  send(str) {
    return this.sendBuffer(Buffer.from(str));
  }

  /**
   * 销毁sender内部实例
   */
  async destroy() {
    await this.pool.end();
    Object.keys(this).forEach((key) => {
      delete this[key];
    });
  }

}

module.exports = {
  Sender: GraylogSender,
  layout: graylogLayout
};
