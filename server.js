var chokidar = require('chokidar');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var path = require('path');
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var jf = require('jsonfile');

// setup webserver port
var port = process.env.PORT || 3000;
server.listen(port);

var dataFolder = argv._[0];

var defaultItem = {
    meta: {},
    items: []
};

var allItems = [];

// serve static files
app.use(express.static(__dirname + '/public'));
// return index.html when requesting /
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
});
// serve video folder
app.use('/data', express.static(dataFolder));
// serve third-party files
app.use('/smoothscroll-polyfill', express.static(__dirname + '/node_modules/smoothscroll-polyfill/dist'));
app.use('/fuse', express.static(__dirname + '/node_modules/fuse.js/dist'));
app.use('/popper', express.static(__dirname + '/node_modules/popper.js/dist'));
app.use('/tooltip', express.static(__dirname + '/node_modules/tooltip.js/dist'));
app.use('/octicons', express.static(__dirname + '/node_modules/octicons'));

// serve items.json
app.use('/items.json', (req, res) => {
    var json = JSON.stringify(allItems);
    console.log('item.json request handler was called.');
    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(json);
});

var getCategoryByPath = function (filePath) {
    var category = path.dirname(filePath).split(path.sep);
    //console.log('Category by path', filePath, category);
    return category;
};

var getItem = function (items, name) {
    for (var i = 0; i < items.length; i++) {
        if (items[i].name === name) {
            return items[i];
        }
    }
};

var createItem = function (item, name) {
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
    item.items = [];
    return item;
};

var addItemRecursive = function (items, category, meta) {
    var curCategory = category[0];
    if (category.length == 1) {
        items.push(createItem(meta, curCategory));
    }
    else if (category.length > 1) {
        var item = getItem(items, curCategory);
        if (!item) {
            item = createItem(JSON.parse(JSON.stringify(defaultItem)), curCategory);
            items.push(item);
        }
        var subCategory = category;
        subCategory.shift();
        addItemRecursive(item.items, subCategory, meta);
    }

    // sort items by title
    items.sort(function(a, b) {
      var titleA = a.meta.title.toUpperCase();
      var titleB = b.meta.title.toUpperCase();

      // switch sort order when a date is detected, so new videos/events appear first
      var dateRegexp = /.*\d{4}.*/;
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
var walkSync = function(dir) {
    try {
        fs.readdirSync(dir).forEach(function(file) {
            var filePath = dir + '/' + file;
            if (fs.statSync(filePath).isDirectory()) {
                walkSync(filePath);
            }
            else {
                var relativeFilePath = path.relative(dataFolder, filePath);

                if (path.basename(file) === 'meta.json') {
                    //console.log('read meta file: ' + relativeFilePath);

                    var item = {
                        type: 'folder',
                        meta: jf.readFileSync(filePath)
                    };

                    var videoFile = path.dirname(filePath) + '/video.mp4';
                    if (fs.existsSync(videoFile)) {
                        item.type = 'video';
                        item.src = '/data/' + path.relative(dataFolder, videoFile);
                    }
                    var category = getCategoryByPath(relativeFilePath);
                    addItemRecursive(allItems, category, item);
                }
            }
        });
    } catch (e) {
        console.error('error while reading dir/file: ' + dir);
    }
};

var reindexItems = function() {
    allItems = [];
    walkSync(dataFolder);
    console.log('reindexed files...');

    //TODO throttle reindex
};

// initially fetch all videos
reindexItems();


// init file watcher to reindex videos in case something changes
chokidar.watch(dataFolder, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    usePolling: true, // set to true if files are on an network share
    interval: 30000, // polling interval
    awaitWriteFinish: { // wait until write operation of file is finished before firing events
      stabilityThreshold: 2000,
      pollInterval: 100
    }
}).on('add', function (filePath) {
    if (path.basename(filePath) !== 'meta.json') return;

    var relativeFilePath = path.relative(dataFolder, filePath);
    console.log('new file: ' + relativeFilePath);

    reindexItems();
}).on('unlink', function (filePath) {
    var relativeFilePath = path.relative(dataFolder, filePath);
    console.log('removed file: ' + relativeFilePath);

    reindexItems();
}).on('change', function (filePath) {
    if (path.basename(filePath) !== 'meta.json') return;

    var relativeFilePath = path.relative(dataFolder, filePath);
    console.log('changed file: ' + relativeFilePath);

    reindexItems();
});


// now it's all up and running...
console.log('App running under http://' + require('os').hostname() + ':' + port + '/');
