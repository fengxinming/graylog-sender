'use strict';

const Sender = require('../index');
const request = require('corie-request');
const Console = require('clrsole');

const { sleep } = request;
const { layout } = Sender;
const logger = new Console('Jest');

describe('测试graylog', () => {

  let sender;
  let content;
  let remotes;
  const graylogLayout = layout();

  beforeAll(async () => {
    const { body } = await request({
      url: 'http://10.57.17.76:80/api/lb/keep_alive?app=talos-open',
      json: true,
      interval: 2000
    });
    if (body.success) {
      if (body.state && body.state.upstream_list) {
        remotes = body
          .state
          .upstream_list
          .filter(item => item.alive)
          .map(item => item.upstream) || [];
      }
    }
    sender = new Sender({
      host: remotes
    });
  });

  it('测试send方法', () => {
    content = graylogLayout(['测试send方法' + (new Date()).toISOString()], {
      app: 'talos-open',
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'app',
      file: 'app.log'
    });
    logger.debug(content);
    return expect(sender.send(content))
      .resolves
      .toBeUndefined();
  });

  it('测试发送超大容量数据', async () => {
    const arr = [];
    let i = 10;
    while (i--) {
      arr[i] = sender;
    }
    content = graylogLayout(arr, {
      app: 'talos-open',
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'app',
      file: 'app.log'
    });
    // logger.debug(content);
    await expect(sender.send(content))
      .resolves
      .toEqual(
        expect.any(Array)
      );

    i = 10;
    while (i--) {
      arr[arr.length] = sender;
    }
    content = graylogLayout(arr, {
      app: 'talos-open',
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'app',
      file: 'app.log'
    });
    // logger.debug(content);
    sender.setHost(remotes.concat(remotes[0]));
    await expect(sender.send(content))
      .resolves
      .toEqual(
        expect.any(Array)
      );
  });

  function random(multiple) {
    return Math.round(Math.random() * multiple);
  }

  it('测试配置异常ip', async () => {
    sender.setHost(`${random(100)}.${random(100)}.${random(100)}.${random(100)}:${random(10000)}`);
    content = graylogLayout(['测试配置异常ip'], {
      app: 'talos-open',
      timestamp: Date.now(),
      level: 'INFO',
      logger: 'app',
      file: 'app.log'
    });
    logger.debug(content);
    // await expect(sender.send(content))
    //   .rejects
    //   .toThrow();
    await expect(sender.send(content))
      .resolves
      .toBeUndefined();

    await sleep(1000);
  });

  it('测试destroy方法', async () => {
    await sleep(4000);
    await expect(sender.destroy())
      .resolves.toBeUndefined();
  });

  afterAll(() => {
    sender = null;
  });

});
