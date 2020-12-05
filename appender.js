'use strict';

const Console = require('clrsole');
const { Sender, layout: graylogLayout } = require('./index');

const defaultLogger = new Console('GraylogAppender');

class GraylogAppender {

  constructor(name, options, config) {
    this.name = name;
    this.options = options || {};
    const { layout, app } = this.options;
    this.app = app;
    this.layout = graylogLayout(layout);
    this.sender = this.getSender(options);
  }

  getSender(options) {
    return new Sender(options);
  }

  async append(args, options) {
    const { sender, layout, app } = this;
    options.app = app;
    await sender
      .send(layout(args, options))
      .catch((e) => {
        defaultLogger.error('Sent message throwing an error: ', e);
      });
  }

  async destroy() {
    try {
      await this.sender.destroy();
      Object.keys(this).forEach((key) => {
        delete this[key];
      });
    } catch (e) {
      defaultLogger.error('called function "destroy" throwing an error: ', e);
    }
  }

}

module.exports = GraylogAppender;
