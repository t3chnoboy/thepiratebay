var Promise, baseUrl, cheerio, getCategories, parseCategories, parsePage, parseResults, recentTorrents, request, search, topTorrents;

request = require('request');

cheerio = require('cheerio');

Promise = require('es6-promise').Promise;

baseUrl = 'http://thepiratebay.se';


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
      q: title || '',
      category: opts.category || '0',
      page: opts.page || '0',
      orderBy: opts.orderBy || '99'
    }
  };
  return parsePage(query, parseResults, cb);
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

getCategories = function(cb) {
  return parsePage(baseUrl + '/recent', parseCategories, cb);
};

parsePage = function(url, parse, cb) {
  if (typeof cb === 'function') {
    request(url, function(err, resp, body) {
      var categories;
      if (err != null) {
        cb(err);
      }
      if (resp.statusCode !== 200) {
        cb(body);
      }
      categories = parse(body);
      return cb(null, categories);
    });
  }
  return new Promise(function(resolve, reject) {
    return request(url, function(err, resp, body) {
      var categories;
      if (err != null) {
        reject(err);
      }
      if (resp.statusCode !== 200) {
        reject(body);
      }
      categories = parse(body);
      return resolve(categories);
    });
  });
};

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

parseResults = function(resultsHTML) {
  var $, rawResults, results;
  $ = cheerio.load(resultsHTML);
  rawResults = $('table#searchResult tr:has(a.detLink)');
  results = rawResults.map(function(elem) {
    var category, leechers, link, magnetLink, name, result, seeders, size, subcategory, torrentLink, uploadDate;
    name = $(this).find('a.detLink').text();
    uploadDate = $(this).find('font').text().match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1];
    size = $(this).find('font').text().match(/Size (.+?),/)[1];
    seeders = $(this).find('td[align="right"]').text();
    leechers = $(this).find('td[align="right"]').next().text();
    link = baseUrl + $(this).find('div.detName a').attr('href');
    magnetLink = $(this).find('a[title="Download this torrent using magnet"]').attr('href');
    torrentLink = $(this).find('a[title="Download this torrent"]').attr('href');
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
      torrentLink: torrentLink
    };
  });
  return results.get();
};

exports.search = search;

exports.topTorrents = topTorrents;

exports.recentTorrents = recentTorrents;

exports.getCategories = getCategories;
