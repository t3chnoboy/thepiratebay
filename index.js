var baseUrl, cheerio, co, getCategories, parseCategories, parseResults, recentTorrents, request, search, topTorrents;

request = require('co-request');

cheerio = require('cheerio');

co = require('co');

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

search = function*(title, opts) {
  var query, response, results;
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
  response = yield request(query);
  results = parseResults(response.body);
  return results;
};

topTorrents = function*(category) {
  var response, results;
  if (category == null) {
    category = 'all';
  }
  response = yield request(baseUrl + '/top/' + category);
  results = parseResults(response.body);
  return results;
};

recentTorrents = function*() {
  var response, results;
  response = yield request(baseUrl + '/recent');
  results = parseResults(response.body);
  return results;
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

getCategories = function*() {
  var categories, response;
  response = yield request(baseUrl + '/recent');
  categories = parseCategories(response.body);
  return categories;
};

exports.search = search;

exports.topTorrents = topTorrents;

exports.recentTorrents = recentTorrents;

exports.getCategories = getCategories;
