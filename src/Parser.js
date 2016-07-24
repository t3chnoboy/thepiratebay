/* eslint newline-per-chained-call: 0 */

/**
 * Parse all pages
 */
import cheerio from 'cheerio';
import fetch from 'isomorphic-fetch';
import URL from 'url-parse';


const maxConcurrentRequests = 2;

export function _parseTorrentIsVIP(element) {
  return (
    element.find('img[title="VIP"]').attr('title') === 'VIP'
  );
}

export function _parseTorrentIsTrusted(element) {
  return (
    element.find('img[title="Trusted"]').attr('title') === 'Trusted'
  );
}

export function isTorrentVerified(element) {
  return _parseTorrentIsVIP(element) || _parseTorrentIsTrusted(element);
}

export function getProxyList() {
  const response = fetch('https://thepiratebay-proxylist.org/')
    .then(res => res.text());

  const $ = cheerio.load(response);
  const links = $('a[rel="nofollow"]').each(element => element.text());

  console.log(links);

  return links;
}

export function parsePage(url, parseCallback, filter = {}, baseUrls = ['https://thepiratebay.se']) {
  const attempt = (_baseUrls = baseUrls) => {
    const requests = _baseUrls.map(baseUrl => fetch(`${baseUrl}${url}`, {
      mode: 'no-cors'
    }));

    if (baseUrls.length === 1) {
      for (let i = 0; i < maxConcurrentRequests; i++) {
        requests.push(requests[0]);
      }
    }

    return Promise.race(requests);
  };

  return attempt().then(async response => (
    (await response.text()).includes('Database maintenance')
      ? attempt(await getProxyList())
      : response
  ))
  .then(response => {
    const burl = (new URL(response.url)).host;
    parseCallback(`https://${burl}`, response.text(), filter);
  });
}

export function parseResults(baseUrl, resultsHTML, filter = {}) {
  const $ = cheerio.load(resultsHTML);
  const rawResults = $('table#searchResult tr:has(a.detLink)');

  const results = rawResults.map(function getRawResults() {
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
    const uploader = $(this).find('font .detDesc').text();
    const uploaderLink = baseUrl + $(this).find('font a').attr('href');
    const verified = isTorrentVerified($(this));

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
      subcategory, uploader, verified, uploaderLink
    };
  });

  const parsedResultsArray = results.get();

  if (filter.verified === true) {
    return parsedResultsArray.filter(result => result.verified === true);
  }

  return parsedResultsArray;
}

export function parseTvShow(baseUrl, tvShowPage) {
  const $ = cheerio.load(tvShowPage);

  const seasons = $('dt a').map(() => $(this).text()).get();

  const rawLinks = $('dd');

  const torrents = rawLinks.map(element =>
    $(this).find('a').map(() => ({
      title: element.text(),
      link: baseUrl + element.attr('href'),
      id: element.attr('href').match(/\/torrent\/(\d+)/)[1]
    }))
    .get()
  );

  return seasons.map(
    (season, index) => ({ title: season, torrents: torrents[index] })
  );
}

export function parseTorrentPage(baseUrl, torrentPage) {
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
  const description = $('div.nfo').text().trim();

  return {
    name, size, seeders, leechers, uploadDate, magnetLink, link,
    id, description, uploader, uploaderLink
  };
}

export function parseTvShows(tvShowsPage) {
  const $ = cheerio.load(tvShowsPage);
  const rawTitles = $('dt a');

  const series = rawTitles.map(
    (element) => ({
      title: element.text(),
      id: element.attr('href').match(/\/tv\/(\d+)/)[1]
    }))
    .get();

  const rawSeasons = $('dd');

  const seasons = rawSeasons.map(
    element => element.find('a').text().match(/S\d+/g)
  );

  return series.map(
    (s, index) => ({ title: s.title, id: s.id, seasons: seasons[index] })
  );
}

export function parseCategories(categoriesHTML) {
  const $ = cheerio.load(categoriesHTML);
  const categoriesContainer = $('select#category optgroup');
  let currentCategoryId = 0;

  const categories = categoriesContainer.map(function getElements() {
    currentCategoryId += 100;
    const category = {
      name: $(this).attr('label'),
      id: `${currentCategoryId}`,
      subcategories: []
    };

    $(this).find('option').each(function getSubcategory() {
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
