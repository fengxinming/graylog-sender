# graylog-sender

> Note: A graylog sender with udp4

[![npm package](https://nodei.co/npm/graylog-sender.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/graylog-sender)

## Usage

develop

```javascript

const Sender = require('graylog-sender');

const layout = Sender.layout();

const sender = new Sender({
  host: '10.57.17.76:80' // [ '10.57.17.76:80' ]
});
const content = layout(['anything you want'], {
  app: 'talos-open',
  timestamp: Date.now(),
  level: 'INFO',
  logger: 'app',
  file: 'app.log'
});

sender
  .send(content)
  .catch((e) => {
    logger.error('Sent message failed: ', e);
  });

function exit(err) {
  setTimeout(() => {
    console.log('exiting...');
    // 异常结束进程
    if (err) {
      console.error(err);
      process.exit(1);
    }

    // 其它连接关闭
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', () => {
  console.log('SIGINT signal received.');

  // 关闭连接
  server.close((err) => {
    console.log('closed http Server');
    sender.destroy().then(() => {
      console.log('destroyed graylog-sender');
    }).catch((e) => {
      console.log('destroyed graylog-sender throwing an error: ', e);
    }).then(() => {
      exit(err);
    });
  });
});

```
