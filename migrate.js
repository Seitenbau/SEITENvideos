var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var detectCharacterEncoding = require('detect-character-encoding');
var Iconv = require('iconv').Iconv;
var bytes = require('bytes');
var shortid = require('shortid');

var argv = require('minimist')(process.argv.slice(2));
var oldDataFolder = argv._[0];
var newDataFolder = argv._[1];
var count = 1;
var totalVideoFileSize = 0;

var ensureDirectoryExistence = function(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

var cleanTitle = function(title, dir = '') {
    var newTitle = title;

    newTitle = newTitle.replace(/\d{8}[_ ]([aAbB]\d_)?/, '').replace('_', '')

    if (dir.indexOf('TechTalks') != -1) {
        newTitle = newTitle.replace('TechTalk : ', '');
    }
    if (dir.indexOf('sdc') != -1) {
        newTitle = newTitle.replace(/SDC\d{4}/, '');
        newTitle = newTitle.replace(/\d{2}t\d[-_]?/, '');
    }

    return newTitle;
};

var walkSync = function(dir) {
    var files = fs.readdirSync(dir);
    var parentFolders = path.relative(oldDataFolder, dir);

    files.forEach(function(file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            walkSync(dir + '/' + file);
        }
        else {
            if (file.indexOf('.mp4') == file.length - 4) {
                console.log(`Found video ${count++}: ${dir}/${file}`);

                var videoName = file.substring(0, file.length-4);

                var metaXmlFile = null;
                if (fs.existsSync(dir + '/' + videoName + '.xml')) {
                    metaXmlFile = dir + '/' + videoName + '.xml';
                } else if (fs.existsSync(dir + '/' + videoName + '.mp4.xml')) {
                    metaXmlFile = dir + '/' + videoName + '.mp4.xml';
                }

                var newVideoName = cleanTitle(videoName, dir);
                var id = shortid.generate();

                var metaJson;
                if (metaXmlFile) {
                    // convert all meta data to UTF-8
                    var fileBuffer = fs.readFileSync(metaXmlFile);
                    const charsetMatch = detectCharacterEncoding(fileBuffer);
                    var iconv = new Iconv(charsetMatch.encoding, 'UTF-8');
                    fileBuffer = iconv.convert(fileBuffer);

                    new xml2js.Parser({ trim: true }).parseString(fileBuffer, function (err, metaXml) {
                        metaJson = {
                            id: id,
                            title: cleanTitle(metaXml.meta.title[0], dir),
                            description: metaXml.meta.description[0],
                            tags: metaXml.meta.tags ? metaXml.meta.tags[0].tag : [],
                            people: metaXml.meta.speaker
                        };
                    });
                } else {
                    console.log('...no meta file found; convert file name', videoName);
                    console.log('...new name', newVideoName);
                    metaJson = {
                        id: id,
                        title: newVideoName,
                        description: '',
                        tags: [],
                        people: []
                    };
                }

                // write new files
                var newPath = path.join(newDataFolder, parentFolders, newVideoName) + '/';
                var newPathMeta = newPath + 'meta.json';
                var newPathVideo = newPath + 'video.mp4';

                ensureDirectoryExistence(newPathMeta);
                fs.writeFileSync(newPathMeta, JSON.stringify(metaJson, null, 4), {}, function (){});
              
                // copy the video files if argument is set; otherwise just create a empty video file
                if (argv.hot) {
                    console.log('...copy video file');
                    fs.copyFileSync(dir + '/' + file, newPathVideo);
                } else {
                    fs.writeFileSync(newPathVideo, 'sample', {}, function (){});
                }
                
                // log video file size
                totalVideoFileSize += fs.statSync(dir + '/' + file).size;

                //console.dir(metaJson);
                console.log('...migration successful');
            }
        }
    });
};

walkSync(oldDataFolder);
console.log(`Finished. Total video size: ${bytes(totalVideoFileSize)}`);