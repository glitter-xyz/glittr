const padStart = require('lodash/padStart');
const log = require('./log.js')('versions');

const length = Object.keys(process.versions).reduce((l, a) => l > a.length ? l : a.length, 0);

for (const key in process.versions) {
  log.info(`${padStart(key, length)}: ${process.versions[key]}`);
}
