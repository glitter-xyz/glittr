const { expect } = require('chai');
const waitForThrowable = require('wait-for-throwable');

const { start, stop } = require('./lib/app-provider.js');
const config = require('./lib/config-provider.js');

const { productName } = require('../package.json');

describe('[smoke tests]', () => {
  const all = async (...promises) => {
    let err;

    await Promise.all(promises.map(p => p.catch(e => {
      err = e;
    })));

    if (err) {
      throw err;
    }
  };

  async function cleanup() {
    const includeLogs = this.currentTest.state === 'failed' || process.env.VERBOSE;

    await all(
      stop(includeLogs),
      config.cleanAll()
    );
  }

  beforeEach(cleanup);
  afterEach(cleanup);

  it('opens the application', async () => {
    const configPath = await config.create({});
    const app = await start(configPath, {
      DEBUG_DAZZLE: 1
    });

    await waitForThrowable(async () => {
      const title = await app.page.evaluate(() => `${document.querySelector('title').innerHTML}`);

      expect(title).to.equal(productName);
    });
  });
});
