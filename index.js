var zlib, Promise, baseUrl, cheerio, getCategories, parseCategories, parsePage, parseResults, recentTorrents, userTorrents, request, search, topTorrents, setUrl;

request = require('request');

cheerio = require('cheerio');

Promise = require('es6-promise').Promise;

baseUrl = 'http://thepiratebay.mn';

zlib = require('zlib');

/*
 *opts:
 *  category
 *    0   - all
 *    101 - 699
 *  page
 *    0 - 99
 *  orderBy
 *     1  - name desc
 *     2  - name asc
 *     3  - date desc
 *     4  - date asc
 *     5  - size desc
 *     6  - size asc
 *     7  - seeds desc
 *     8  - seeds asc
 *     9  - leeches desc
 *     10 - leeches asc
 */

search = function(title, opts, cb) {
    var query;
    if (opts == null) {
        opts = {};
    }
    query = {
        url: baseUrl + '/s/',
        qs: {
            q: title || '*',
            category: opts.category || '0',
            page: opts.page || '0',
            orderby: opts.orderBy || '99'
        }
    };
    return parsePage(query, parseResults, cb);
};

getTorrent = function(id, cb) {
  var url = (typeof id === Number) || /^\d+$/.test(id) ? "" + baseUrl + "/torrent/" + id : id.link || id;
  return parsePage({
    url: url
  }, parseTorrentPage, cb);
};

topTorrents = function(category, cb) {
    if (category == null) {
        category = 'all';
    }
    return parsePage(baseUrl + '/top/' + category, parseResults, cb);
};

recentTorrents = function(cb) {
    return parsePage(baseUrl + '/recent', parseResults, cb);
};

userTorrents = function(userName, opts, cb) {
    var query;
    if (opts == null) {
        opts = {};
    }
    query = {
        url: baseUrl + '/user/' + userName,
        qs: {
            page: opts.page || '0',
            orderby: opts.orderBy || '99'
        }
    };
    return parsePage(query, parseResults, cb);
};

tvShows = function(cb) {
    return parsePage(baseUrl + '/tv/all', parseTvShows, cb);
};

getTvShow = function(id, cb) {
    return parsePage(baseUrl + '/tv/' + id, parseTvShow, cb);
};

getCategories = function(cb) {
    return parsePage(baseUrl + '/recent', parseCategories, cb);
};

parsePage = function(url, parse, cb) {
    if (typeof cb === 'function') {
        requestWithEncoding(url, function(err, data) {
            var categories;
            if (err) {
                cb(err);
            } else {
              categories = parse(data);
              return cb(null, categories);
            }
        });
    }
    return new Promise(function(resolve, reject) {
        var categories;
        requestWithEncoding(url, function(err, data) {
            if (err) {
                reject(err);
            } else {
                categories = parse(data);
                return resolve(categories);
            }
        })
    });
};

var requestWithEncoding = function(options, callback) {
    var req = request(options);

    req.on('response', function(res) {
        var chunks = [];
        res.on('data', function(chunk) {
            chunks.push(chunk);
        });

        res.on('end', function() {
            var buffer = Buffer.concat(chunks);
            var encoding = res.headers['content-encoding'];
            if (encoding == 'gzip') {
                zlib.gunzip(buffer, function(err, decoded) {
                    callback(err, decoded && decoded.toString());
                });
            } else if (encoding == 'deflate') {
                zlib.inflate(buffer, function(err, decoded) {
                    callback(err, decoded && decoded.toString());
                })
            } else {
                callback(null, buffer.toString());
            }
        });
    });

    req.on('error', function(err) {
        callback(err);
    });
}

parseCategories = function(categoriesHTML) {
    var $, categories, categoriesContainer, currentCategoryId;
    $ = cheerio.load(categoriesHTML);
    categoriesContainer = $('select#category optgroup');
    currentCategoryId = 0;
    categories = categoriesContainer.map(function(elem) {
        var category;
        currentCategoryId += 100;
        category = {
            name: $(this).attr('label'),
            id: currentCategoryId + '',
            subcategories: []
        };
        $(this).find('option').each(function(opt) {
            var subcategory;
            subcategory = {
                id: $(this).attr('value'),
                name: $(this).text()
            };
            return category.subcategories.push(subcategory);
        });
        return category;
    });
    return categories.get();
};


parseTvShows = function(tvShowsPage) {
    var $, rawResults, results = [];
    $ = cheerio.load(tvShowsPage);
    rawTitles = $('dt a');
    series = rawTitles.map(function(elem) {
      return {
        title: $(this).text(),
        id: $(this).attr('href').match(/\/tv\/(\d+)/)[1]
      };
    }).get();

    rawSeasons = $('dd');
    var seasons = []

    rawSeasons.each(function(elem) {
      seasons.push($(this).find('a')
                    .text()
                    .match(/S\d+/g));
    });

    series.forEach(function(s, index){
      results.push({
        title: s.title,
        id: s.id,
        seasons: seasons[index]
      });
    });

    return results;
};


parseTvShow = function(tvShowPage) {
    var $, rawResults, results = [], seasons = [], torrents = [];
    $ = cheerio.load(tvShowPage);

    seasons = $('dt a').map(function(elem) {
      return $(this).text();
    }).get();

    rawLinks = $('dd');

    rawLinks.each(function(elem) {
      torrents.push($(this).find('a').map(function(link){
        return {
          title: $(this).text(),
          link: (baseUrl + $(this).attr('href')),
          id: $(this).attr('href').match(/\/torrent\/(\d+)/)[1]
        }
      }).get());
    });

    seasons.forEach(function(s, index){
      results.push({
        title: s,
        torrents: torrents[index]
      });
    });

    return results;
};

parseTorrentPage = function(torrentPage) {
  var $, filesCount, leechers, name, seeders, size, torrent, uploadDate;
  $ = cheerio.load(torrentPage);
  name = $('#title').text().trim();
  // filesCount = parseInt($('a[title="Files"]').text());
  size = $('dt:contains(Size:) + dd').text().trim();
  uploadDate = $('dt:contains(Uploaded:) + dd').text().trim();
  uploader = $('dt:contains(By:) + dd').text().trim();
  uploaderLink = baseUrl + $('dt:contains(By:) + dd a').attr('href');
  seeders = $('dt:contains(Seeders:) + dd').text().trim();
  leechers = $('dt:contains(Leechers:) + dd').text().trim();
  id = $('input[name=id]').attr('value');
  link = baseUrl + '/torrent/' + id
  magnetLink = $('a[title="Get this torrent"]').attr('href');
  torrentLink = $('a[title="Torrent File"]').attr('href');
  description = $('div.nfo').text().trim();
  picture = 'http:' + $('img[title="picture"]').attr('src');
  return torrent = {
    name: name,
    // filesCount: filesCount,
    size: size,
    seeders: seeders,
    leechers: leechers,
    uploadDate: uploadDate,
    torrentLink: torrentLink,
    magnetLink: magnetLink,
    link: link,
    id: id,
    description: description,
    picture: picture,
    uploader: uploader,
    uploaderLink: uploaderLink
  };
};


parseResults = function(resultsHTML) {
    var $, rawResults, results;
    $ = cheerio.load(resultsHTML);
    rawResults = $('table#searchResult tr:has(a.detLink)');
    results = rawResults.map(function(elem) {
        var category, leechers, link, magnetLink, name, result, seeders, size, subcategory, torrentLink, uploadDate;
        name = $(this).find('a.detLink').text();
        uploadDate = $(this).find('font').text().match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1];
        size = $(this).find('font').text().match(/Size (.+?),/)[1];
        seeders = $(this).find('td[align="right"]').first().text();
        leechers = $(this).find('td[align="right"]').next().text();
        link = baseUrl + $(this).find('div.detName a').attr('href');
        magnetLink = $(this).find('a[title="Download this torrent using magnet"]').attr('href');
        torrentLink = $(this).find('a[title="Download this torrent"]').attr('href');
        uploader = $(this).find('font .detDesc').text();
        uploaderLink = baseUrl + $(this).find('font a').attr('href');
        category = {
            id: $(this).find('center a').first().attr('href').match(/\/browse\/(\d+)/)[1],
            name: $(this).find('center a').first().text()
        };
        subcategory = {
            id: $(this).find('center a').last().attr('href').match(/\/browse\/(\d+)/)[1],
            name: $(this).find('center a').last().text()
        };
        return result = {
            name: name,
            size: size,
            link: link,
            category: category,
            seeders: seeders,
            leechers: leechers,
            uploadDate: uploadDate,
            magnetLink: magnetLink,
            subcategory: subcategory,
            torrentLink: torrentLink,
            uploader: uploader,
            uploaderLink: uploaderLink
        };
    });
    return results.get();
};

setUrl = function(url) {
  baseUrl = url;
};

exports.search         = search;
exports.topTorrents    = topTorrents;
exports.recentTorrents = recentTorrents;
exports.userTorrents   = userTorrents;
exports.getCategories  = getCategories;
exports.tvShows        = tvShows;
exports.getTvShow      = getTvShow;
exports.getTorrent     = getTorrent;
exports.setUrl         = setUrl;
