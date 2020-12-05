'use strict';

const GraylogAppender = require('../appender');
const request = require('corie-request');

const { sleep } = request;

describe('测试 appender', () => {

  let appender;

  beforeAll(async () => {
    const { body } = await request({
      url: 'http://10.57.17.76:80/api/lb/keep_alive?app=talos-open',
      json: true,
      interval: 2000
    });
    let remotes;
    if (body.success) {
      if (body.state && body.state.upstream_list) {
        remotes = body
          .state
          .upstream_list
          .filter(item => item.alive)
          .map(item => item.upstream) || [];
      }
    }
    appender = new GraylogAppender('graylog', {
      host: remotes,
      app: 'talos-open'
    });
    await sleep(2000);
  });

  it('测试append方法', () => {
    return expect(appender.append(['测试append方法'], {
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'app',
      file: 'app.log'
    })).resolves.toBeUndefined();
  });

  it('测试append方法2', () => {
    return expect(appender.append([appender], {
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'service',
      file: 'service.log'
    })).resolves.toBeUndefined();
  });

  it('测试发送超大容量数据', () => {
    const arr = [];
    let i = 10;
    while (i--) {
      arr[i] = appender;
    }
    return expect(appender.append(arr, {
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'service',
      file: 'service.log'
    })).resolves.toBeUndefined();
  });

  it('测试配置异常ip', async () => {
    const appender2 = new GraylogAppender('graylog', {
      host: '10.57.17.534:5323',
      app: 'talos-open'
    });
    await sleep(3000);
    const ret = await appender2.append(['测试配置异常ip'], {
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'service',
      file: 'service.log'
    });
    expect(ret).toBeUndefined();
    await sleep(1000);
    await appender2.destroy();
  });

  it('测试未传入host', () => {
    expect(() => {
      /* eslint no-new: 0 */
      new GraylogAppender('graylog', {
        app: 'talos-open'
      });
    }).toThrow();
  });

  it('测试ready方法', () => {
    return expect(() => {
      appender.ready({});
    }).toThrow();
  });

  it('测试异常地destroy方法', async () => {
    const destroy = appender.sender.destroy;
    appender.sender.destroy = null;
    await expect(appender.destroy())
      .resolves.toBeUndefined();
    appender.sender.destroy = destroy;
  });

  it('测试destroy方法', async () => {
    await sleep(2000);
    await expect(appender.destroy())
      .resolves.toBeUndefined();
  });

  it('测试destroy方法2', () => {
    return expect(appender.destroy())
      .resolves.toBeUndefined();
  });

  afterAll(() => {
    appender = null;
  });

});
