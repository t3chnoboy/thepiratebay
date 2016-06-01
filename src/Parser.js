/* eslint newline-per-chained-call: 0 */

/**
 * Parse all pages
 *
 * @todo: support callbacks with callbackify
 */
import cheerio from 'cheerio';
import zlib from 'zlib';
import request from 'request';
import { baseUrl } from './Torrent';


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
    const uploadDate = $(this).find('font').text()
      .match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1];
    const size = $(this).find('font').text()
      .match(/Size (.+?),/)[1];

    const seeders = $(this).find('td[align="right"]').first().text();
    const leechers = $(this).find('td[align="right"]').next().text();
    const relativeLink = $(this).find('div.detName a').attr('href');
    const link = baseUrl + relativeLink;
    const id = parseInt(/^\/torrent\/(\d+)/.exec(relativeLink)[1], 10);
    const magnetLink = $(this).find('a[title="Download this torrent using magnet"]').attr('href');
    const torrentLink = $(this).find('a[title="Download this torrent"]').attr('href');
    const uploader = $(this).find('font .detDesc').text();
    const uploaderLink = baseUrl + $(this).find('font a').attr('href');

    const category = {
      id: $(this).find('center a').first().attr('href').match(/\/browse\/(\d+)/)[1],
      name: $(this).find('center a').first().text()
    };

    const subcategory = {
      id: $(this).find('center a').last().attr('href').match(/\/browse\/(\d+)/)[1],
      name: $(this).find('center a').last().text()
    };

    return {
      id, name, size, link, category, seeders, leechers, uploadDate, magnetLink,
      subcategory, torrentLink, uploader, uploaderLink
    };
  });
  return results.get();
}

export function parseTvShow(tvShowPage) {
  const torrents = [];
  const results = [];
  const $ = cheerio.load(tvShowPage);

  const seasons = $('dt a').map(function () {
    return $(this).text();
  }).get();

  const rawLinks = $('dd');

  rawLinks.each(function (elem) {
    torrents.push($(this).find('a').map(function (link) {
      return {
        title: $(this).text(),
        link: (baseUrl + $(this).attr('href')),
        id: $(this).attr('href').match(/\/torrent\/(\d+)/)[1]
      };
    }).get());
  });

  return seasons.map(
    (season, index) => ({ title: season, torrents: torrents[index] })
  );
}

export function parseTorrentPage(torrentPage) {
  const $ = cheerio.load(torrentPage);
  const name = $('#title').text().trim();

  // filesCount = parseInt($('a[title="Files"]').text());
  const size = $('dt:contains(Size:) + dd').text().trim();
  const uploadDate = $('dt:contains(Uploaded:) + dd').text().trim();
  const uploader = $('dt:contains(By:) + dd').text().trim();
  const uploaderLink = baseUrl + $('dt:contains(By:) + dd a').attr('href');
  const seeders = $('dt:contains(Seeders:) + dd').text().trim();
  const leechers = $('dt:contains(Leechers:) + dd').text().trim();
  const id = $('input[name=id]').attr('value');
  const link = `${baseUrl}/torrent/${id}`;
  const magnetLink = $('a[title="Get this torrent"]').attr('href');
  const torrentLink = $('a[title="Torrent File"]').attr('href');
  const description = $('div.nfo').text().trim();
  const picture = 'http:' + $('img[title="picture"]').attr('src');

  return {
    name, size, seeders, leechers, uploadDate, torrentLink, magnetLink, link,
    id, description, picture, uploader, uploaderLink
  };
}

export function parseTvShows(tvShowsPage) {
  const $ = cheerio.load(tvShowsPage);
  const rawTitles = $('dt a');

  const series = rawTitles.map(function(elem) {
    return {
      title: $(this).text(),
      id: $(this).attr('href').match(/\/tv\/(\d+)/)[1]
    };
  }).get();

  const rawSeasons = $('dd');
  const seasons = [];

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
  const $ = cheerio.load(categoriesHTML);
  const categoriesContainer = $('select#category optgroup');
  let currentCategoryId = 0;
  const categories = categoriesContainer.map(function getElements(elem) {
    currentCategoryId += 100;
    const category = {
      name: $(this).attr('label'),
      id: `${currentCategoryId}`,
      subcategories: []
    };

    $(this).find('option').each(function getSubcategory(opt) {
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
