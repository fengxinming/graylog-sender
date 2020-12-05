'use strict';

const request = require('corie-request');
const Console = require('clrsole');
const GraylogSender = require('./index');

const { Abortion, sleep } = request;
const defaultLogger = new Console('CustomSender');

class CustomSender extends GraylogSender {

  constructor(options) {
    super(options);
    this.ready(options)
      .catch((err) => {
        defaultLogger.error('get remote host error', err);
      });
  }

  /**
   * 获取所有graylog服务器信息
   * @param {Object} options
   */
  async ready({ app, uri }) {
    // keepAlive服务器host
    const host = this.remotes.map(n => `${n[0]}:${n[1]}`);
    const remoteURI = uri || '/api/lb/keep_alive';
    // 可以中断请求
    const abortion = this.abortion = new Abortion();
    let version;
    try {
      const { body } = await request({
        abortion,
        host,
        url: `${remoteURI}?app=${app}`,
        json: true,
        interval: 2000
      });
      if (body.success) {
        version = body.version || 0;
        if (body.state && body.state.upstream_list) {
          this.remotes = body
            .state
            .upstream_list
            .filter(item => item.alive)
            .map(item => item.upstream.split(':')) || [];
        }
      }
      this.loop = true;
      this.keepAlive(remoteURI, host, version, app);
    } catch (err) {
      let { error } = err;
      throw error || err;
    }
  }

  /**
   * 保持连接
   * @param {String} remoteURI
   * @param {Array} host
   * @param {String|Number} version
   * @param {String} appName
   */
  async keepAlive(remoteURI, host, version, appName) {
    if (version && appName) {
      let error;
      try {
        // 可以中断请求
        const { body } = await request({
          host,
          abortion: this.abortion,
          uri: `${remoteURI}?version=${version}&app=${appName}`,
          json: true
        });
        if (body.success && body.changed) {
          version = body.version || version;
          if (body.state && body.state.upstream_list) {
            host = body
              .state
              .upstream_list
              .filter(item => item.alive)
              .map(item => item.upstream.split(':')) || [];
          }
        }
      } catch (res) {
        error = res.error;
        defaultLogger.error('keep alive error: ', error, 'body: ', res.body);
      }
      // 请求被主动中断，触发异常 ERR_REQUEST_ABORTED
      if (!this.loop || (error && error.code === 'ERR_REQUEST_ABORTED')) {
        return;
      }
      await sleep(5000);
      await this.keepAlive(remoteURI, host, version, appName);
    }
  }

  /**
     * 销毁sender内部实例
     */
  async destroy() {
    if (this.abortion) {
      this.abortion.abort();
    }
    this.loop = false;
    await super.destroy();
  }

}

CustomSender.layout = GraylogSender.layout;

module.exports = CustomSender;
