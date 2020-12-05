'use strict';

const Sender = require('./custom');
const GraylogAppender = require('./appender');

class TDGraylogAppender extends GraylogAppender {

  getSender(options) {
    return new Sender(options);
  }

}

module.exports = TDGraylogAppender;
