'use strict';

const Sender = require('../custom');
const request = require('corie-request');
const Console = require('clrsole');

const { sleep } = request;
const { layout } = Sender;
const logger = new Console('Jest');

describe('测试graylog', () => {

  let sender;
  let content;
  const graylogLayout = layout();

  beforeAll(async () => {
    sender = new Sender({
      host: ['10.57.17.76:80'],
      app: 'talos-open'
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

  it('测试destroy方法', async () => {
    await sleep(4000);
    await expect(sender.destroy())
      .resolves.toBeUndefined();
  });

  afterAll(() => {
    sender = null;
    content = null;
  });

});
