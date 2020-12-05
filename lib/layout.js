'use strict';

const { inspect, format } = require('util');
const stringify = require('fastest-stable-stringify');
const syslog = require('./syslog-levels');
const localIP = require('./local-IP');

const levels = {};
syslog.forEach(({ level, value }) => {
  levels[level] = value;
});

/**
 * 转换成graylog需要的日志对象
 * @param {Object} layout 配置参数
 */
module.exports = function (layout = {}) {
  const host = localIP();
  const { depth = Infinity } = layout;
  return function (args, {
    app,
    logger,
    level,
    timestamp,
    file
  }) {
    return stringify({
      app,
      host,
      file,
      logger,
      short_message: args.map(arg => typeof arg === 'object' ? inspect(arg, { depth }) : format(arg)).join(' '),
      facility: 'node.js',
      timestamp: timestamp / 1000,
      level: levels[level]
    });
  };
};
