'use strict';

const Sender = require('../../index');
const request = require('corie-request');
const Console = require('clrsole');

const { sleep } = request;
const { layout } = Sender;

const logger = new Console('Jest');
const graylogLayout = layout();

async function test() {
  let remotes;
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
  const sender = new Sender({
    host: remotes
  });
  const content = graylogLayout(['example: ' + (new Date()).toISOString()], {
    app: 'talos-open',
    timestamp: Date.now(),
    level: 'INFO',
    logger: 'app',
    file: 'app.log'
  });
  logger.info(content);
  sender
    .send(content)
    .catch((e) => {
      logger.error('Sent message failed: ', e);
    });
  await sleep(2000);
  sender.destroy();
}

test();

process
  // 未捕获promise
  .on('unhandledRejection', (reason, p) => {
    console.error('reason: ', reason, 'p: ', p);
  });
