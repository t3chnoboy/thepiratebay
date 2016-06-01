export function parsePage(url, parse) {
  if (typeof cb === 'function') {
    requestWithEncoding(url, function(err, data) {
      var categories;
      if (err) {
        cb(err);
      } else {
        try {
          categories = parse(data);
        }
        catch(err) {
          return cb(err);
        }
        return cb(null, categories);
      }
    });
  }

  return new Promise((resolve, reject) => {
    var categories;
    requestWithEncoding(url, function(err, data) {
      if (err) {
        reject(err);
      } else {
        try {
          categories = parse(data);
        }
        catch(err) {
          return reject(err)
        }
        return resolve(categories);
      }
    })
  });
}



export function parseResults(resultsHTML) {
  var $, rawResults, results;
  $ = cheerio.load(resultsHTML);
  rawResults = $('table#searchResult tr:has(a.detLink)');
  results = rawResults.map(function(elem) {
    var id, category, leechers, link, magnetLink, name, result, seeders, size, subcategory, torrentLink, uploadDate, relativeLink;
    name = $(this).find('a.detLink').text();
    uploadDate = $(this).find('font').text().match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1];
    size = $(this).find('font').text().match(/Size (.+?),/)[1];
    seeders = $(this).find('td[align="right"]').first().text();
    leechers = $(this).find('td[align="right"]').next().text();
    relativeLink = $(this).find('div.detName a').attr('href');
    link = baseUrl + relativeLink;
    id = parseInt(/^\/torrent\/(\d+)/.exec(relativeLink)[1]);
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
};
