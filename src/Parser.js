/**
 * Parse all pages
 *
 * @todo: support callbacks with callbackify
 */
import cheerio from 'cheerio';
import zlib from 'zlib';
import request from 'request';


export function parsePage(url, parse) {
  return new Promise((resolve, reject) => {
    let categories;

    requestWithEncoding(url, (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          categories = parse(data);
        } catch (error) {
          return reject(error);
        }

        return resolve(categories);
      }
    });
  });
}

export function parseResults(resultsHTML) {
  const $ = cheerio.load(resultsHTML);
  const rawResults = $('table#searchResult tr:has(a.detLink)');

  const results = rawResults.map(function getRawResults(elem) {
    const name = $(this).find('a.detLink').text();
    const uploadDate = $(this).find('font').text().match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1];
    const size = $(this).find('font').text().match(/Size (.+?),/)[1];
    const seeders = $(this).find('td[align="right"]').first().text();
    const leechers = $(this).find('td[align="right"]').next().text();
    const relativeLink = $(this).find('div.detName a').attr('href');
    const link = baseUrl + relativeLink;
    const id = parseInt(/^\/torrent\/(\d+)/.exec(relativeLink)[1]);
    const magnetLink = $(this).find('a[title="Download this torrent using magnet"]').attr('href');
    const torrentLink = $(this).find('a[title="Download this torrent"]').attr('href');
    const uploader = $(this).find('font .detDesc').text();
    const uploaderLink = baseUrl + $(this).find('font a').attr('href');
    category = {
      id: $(this).find('center a').first().attr('href').match(/\/browse\/(\d+)/)[1],
      name: $(this).find('center a').first().text()
    };

    const subcategory = {
      id: $(this).find('center a').last().attr('href').match(/\/browse\/(\d+)/)[1],
      name: $(this).find('center a').last().text()
    };

    return result = {
      id,
      name,
      size,
      link,
      category,
      seeders,
      leechers,
      uploadDate,
      magnetLink,
      subcategory,
      torrentLink,
      uploader,
      uploaderLinkk
    };
  });
  return results.get();
}

export function parseTvShow(tvShowPage) {
  let $, rawResults, results = [], seasons = [], torrents = [];
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
}

export function parseTorrentPage(torrentPage) {
  let $, filesCount, leechers, name, seeders, size, torrent, uploadDate;
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

  return {
    name, size, seeders, leechers, uploadDate, torrentLink, magnetLink, link,
    id, description, picture, uploader, uploaderLink
  };
}

export function parseTvShows(tvShowsPage) {
  let $, rawResults, results = [];
  $ = cheerio.load(tvShowsPage);
  rawTitles = $('dt a');
  series = rawTitles.map(function(elem) {
    return {
      title: $(this).text(),
      id: $(this).attr('href').match(/\/tv\/(\d+)/)[1]
    };
  }).get();

  rawSeasons = $('dd');
  let seasons = []

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
}

export function parseCategories(categoriesHTML) {
  let $, categories, categoriesContainer, currentCategoryId;
  $ = cheerio.load(categoriesHTML);
  categoriesContainer = $('select#category optgroup');
  currentCategoryId = 0;
  categories = categoriesContainer.map(function(elem) {
    let category;
    currentCategoryId += 100;
    category = {
      name: $(this).attr('label'),
      id: currentCategoryId + '',
      subcategories: []
    };
    $(this).find('option').each(function(opt) {
      const subcategory = {
        id: $(this).attr('value'),
        name: $(this).text()
      };

      return category.subcategories.push(subcategory);
    });

    return category;
  });

  return categories.get();
}

export function requestWithEncoding(options, callback) {
  const req = request(options);

  req.on('response', (res) => {
    const chunks = [];

    res.on('data', (chunk) => {
      chunks.push(chunk);
    });

    res.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const encoding = res.headers['content-encoding'];
      if (encoding === 'gzip') {
        zlib.gunzip(buffer, (err, decoded) => {
          callback(err, decoded && decoded.toString());
        });
      } else if (encoding === 'deflate') {
        zlib.inflate(buffer, (err, decoded) => {
          callback(err, decoded && decoded.toString());
        });
      } else {
        callback(null, buffer.toString());
      }
    });
  });

  req.on('error', (err) => {
    callback(err);
  });
}
