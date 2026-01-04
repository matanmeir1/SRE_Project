const log4js = require('log4js');

log4js.configure({
  appenders: {
    console: {
      type: 'console',
      layout: {
        type: 'messagePassThrough'
      }
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'info'
    }
  }
});

const logger = log4js.getLogger();

// Override info method to output pure JSON
const originalInfo = logger.info.bind(logger);
logger.info = (data) => {
  if (typeof data === 'object') {
    originalInfo(JSON.stringify(data));
  } else {
    originalInfo(data);
  }
};

module.exports = logger;

