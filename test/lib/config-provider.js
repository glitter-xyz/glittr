const { writeFile, unlink } = require('fs').promises;
const tempy = require('tempy');

const files = {};

const rm = file => unlink(file).catch(err => {
  if (err.code !== 'ENOENT') {
    throw err;
  }
});

const create = async configObj => {
  const file = tempy.file({ extension: 'json' });
  await clean(file);
  await writeFile(file, JSON.stringify(configObj));

  files[file] = true;
  return file;
};

const clean = async file => {
  await rm(file);
  delete files[file];
};

const cleanAll = async () => {
  for (let file in files) {
    await clean(file);
  }
};

module.exports = { create, clean, cleanAll };
