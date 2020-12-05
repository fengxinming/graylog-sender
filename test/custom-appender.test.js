'use strict';

const TDGraylogAppender = require('../custom-appender');
const request = require('corie-request');

const { sleep } = request;

describe('测试td appender', () => {

  let appender;

  beforeAll(async () => {
    appender = new TDGraylogAppender('graylog', {
      host: '10.57.17.76:80',
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
    let appender2;
    try {
      appender2 = new TDGraylogAppender('graylog', {
        host: '10.57.17.534:5323',
        app: 'talos-open'
      });
    } catch (e) { }
    if (appender2) {
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
    }
  });

  it('测试异常地destroy方法', async () => {
    const destroy = appender.sender.destroy;
    appender.sender.destroy = null;
    await expect(appender.destroy())
      .resolves
      .toBeUndefined();
    appender.sender.destroy = destroy;
    await appender.destroy();
  });

  afterAll(() => {
    appender = null;
  });

});
