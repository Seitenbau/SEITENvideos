const chokidar = require('chokidar');
const compression = require('compression');
const express = require('express');
const app = express().use(compression());
const server = require('http').createServer(app);
const jsonParser = require('body-parser').json();
const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const jf = require('jsonfile');
const speakingurl = require('speakingurl');
const debounce = require('lodash.debounce');

// check env
const env = process.env.NODE_ENV || 'production';

// setup webserver port
const port = process.env.PORT || 3000;
server.listen(port);

const dataFolder = argv._[0] || './data';

const defaultItem = {
  meta: {},
  items: []
};

let allItems = [];

const publicFolder = path.resolve(__dirname + '/../build/public');

// serve static files
app.use(express.static(publicFolder));

// serve video folder
app.use('/data', express.static(dataFolder));

// serve items.json
app.use('/items.json', (req, res) => {
  if (env === 'development') {
    // serve testdata when available
    const testDataFileName = 'items-testdata.json';
    if (fs.existsSync(testDataFileName)) {
      console.log('serving items-testdata.json');
      res.sendFile(path.resolve(__dirname + '/../' + testDataFileName));
      return;
    }
  }

  // serve real data
  res.json({ items: allItems });
});

// handle POST requests to edit meta data via UI
app.post('**/meta.json', jsonParser, (req, res) => {
  const metaFilePath = path.join(dataFolder, req.path.replace('data/', ''));
  console.log('POST ', metaFilePath);

  if (!fs.existsSync(metaFilePath)) {
    res.status(404).end();
  }

  // save meta.json
  // TODO refactor; make async
  const newMeta = req.body;
  const meta = jf.readFileSync(metaFilePath);
  meta.title = newMeta.title;
  meta.description = newMeta.description;
  meta.people = newMeta.people;
  meta.tags = newMeta.tags;
  fs.writeFileSync(metaFilePath, JSON.stringify(meta, null, 4));

  // TODO refactor
  // reindex all items and send to client
  allItems = [];
  walkSync(dataFolder);
  res.json({ items: allItems });
});

// catch all unmatched, this needs to come last
app.use('*', (req, res) => {
  res.sendFile(path.resolve(`${publicFolder}/index.html`));
});

const getCategoryByPath = function(filePath) {
  const category = path.dirname(filePath).split(path.sep);
  //console.log('Category by path', filePath, category);
  return category;
};

const getItem = function(items, name) {
  return items.find(item => item.name === name);
};

const createItem = function(item, name) {
  item.name = name;
  if (!item.meta) {
    item.meta = {};
  }
  if (!item.meta.title) {
    item.meta.title = name;
  }
  if (!item.type) {
    item.type = 'folder';
  }
  if (item.type == 'video') {
    item.meta.slug = speakingurl(item.meta.title);
  }
  item.items = [];
  return item;
};

const addItemRecursive = function(items, category, meta) {
  const curCategory = category[0];
  if (category.length == 1) {
    items.push(createItem(meta, curCategory));
  } else if (category.length > 1) {
    let item = getItem(items, curCategory);
    if (!item) {
      item = createItem(JSON.parse(JSON.stringify(defaultItem)), curCategory);
      items.push(item);
    }
    const subCategory = category;
    subCategory.shift();
    addItemRecursive(item.items, subCategory, meta);
  }

  // sort items by title
  items.sort(function(a, b) {
    const titleA = a.meta.title.toUpperCase();
    const titleB = b.meta.title.toUpperCase();

    // switch sort order when a date is detected, so new videos/events appear first
    const dateRegexp = /.*\d{4}.*/;
    if (titleA.match(dateRegexp) && titleB.match(dateRegexp)) {
      if (titleA < titleB) {
        return 1;
      }
      if (titleA > titleB) {
        return -1;
      }
    } else {
      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
    }

    // equal title
    return 0;
  });
};

// fetch all video files from file system
const walkSync = function(dir) {
  try {
    fs.readdirSync(dir).forEach(function(file) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        walkSync(filePath);
      } else {
        if (path.basename(file) === 'meta.json') {
          //console.log('read meta file: ' + relativeFilePath);

          const item = {
            type: 'folder',
            meta: jf.readFileSync(filePath)
          };

          const videoFile = path.join(path.dirname(filePath), 'video.mp4');
          if (fs.existsSync(videoFile)) {
            item.type = 'video';
            item.src = path.join('/data/', path.relative(dataFolder, videoFile));
          }
          const relativeFilePath = path.relative(dataFolder, filePath);
          const category = getCategoryByPath(relativeFilePath);
          addItemRecursive(allItems, category, item);
        }
      }
    });
  } catch (e) {
    console.error('error while reading dir/file: ' + dir);
  }
};

const reindexItems = debounce(function() {
  console.log('reindexing files...');
  allItems = [];
  walkSync(dataFolder);
  console.log('...reindexing done');
}, 1000); // debounced so a bunch of file system changes won't cause a bunch of reindexings

// initially fetch all videos
reindexItems();

// init file watcher to reindex videos in case something changes
chokidar
  .watch(dataFolder, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    usePolling: true, // set to true if files are on an network share
    interval: 30000, // polling interval
    binaryInterval: 30000,
    awaitWriteFinish: {
      // wait until write operation of file is finished before firing events
      stabilityThreshold: 15000,
      pollInterval: 5000
    }
  })
  .on('add', function(filePath) {
    if (path.basename(filePath) !== 'meta.json') {
      return;
    }

    const relativeFilePath = path.relative(dataFolder, filePath);
    console.log('new file: ' + relativeFilePath);

    reindexItems();
  })
  .on('unlink', function(filePath) {
    const relativeFilePath = path.relative(dataFolder, filePath);
    console.log('removed file: ' + relativeFilePath);

    reindexItems();
  })
  .on('change', function(filePath) {
    if (path.basename(filePath) !== 'meta.json') {
      return;
    }

    const relativeFilePath = path.relative(dataFolder, filePath);
    console.log('changed file: ' + relativeFilePath);

    reindexItems();
  });

// now it's all up and running...
console.log(
  'App running under http://' + require('os').hostname() + ':' + port + '/'
);
console.log('...data folder:', dataFolder);
