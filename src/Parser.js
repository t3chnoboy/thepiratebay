/* eslint newline-per-chained-call: 0 */

/**
 * Parse all pages
 */
import UrlParse from 'url-parse';
import cheerio from 'cheerio';
import fetch from 'isomorphic-fetch';


const maxConcurrentRequests = 3;

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

export async function getProxyList() {
  console.log('Retriving proxy list...');

  const response = await fetch('https://proxybay.tv/')
    .then(res => res.text());

  const $ = cheerio.load(response);

  const links = $('[rel="nofollow"]').map(function getElementLinks() {
    return $(this).attr('href');
  })
  .get()
  .filter((res, index) => (index < maxConcurrentRequests));

  return links;
}

export function parsePage(url, parseCallback, filter = {}, opts = {}) {
  const proxyUrls = opts.endpoint
    ? [opts.endpoint]
    : [
      'https://thepiratebay.org',
      'https://thepiratebay.se',
      'https://pirateproxy.one',
      'https://ahoy.one'
    ];

  const requests = proxyUrls
    .map(_url => (new UrlParse(url)).set('hostname', new UrlParse(_url).hostname).href)
    .map(_url => fetch(_url, { mode: 'no-cors' }));

  return Promise
    .race(requests)
    .then(async response => ({
      text: await response.text(),
      _url: `https://${new UrlParse(await response.url).hostname}`
    }))
    .then(({ text, _url }) => parseCallback(text, filter, _url));
}

export function parseResults(resultsHTML, filter = {}, baseUrl) {
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
      uploader,
      verified,
      uploaderLink
    };
  });

  const parsedResultsArray = results.get();

  if (filter.verified === true) {
    return parsedResultsArray.filter(result => result.verified === true);
  }

  return parsedResultsArray;
}

export function parseTvShow(tvShowPage, filter, baseUrl) {
  const $ = cheerio.load(tvShowPage);

  const seasons = $('dt a').map(function mapTvShow() {
    return $(this).text();
  })
  .get();

  const rawLinks = $('dd');

  const torrents = rawLinks.map(function mapTvShowTorrents() {
    return $(this).find('a').map(function mapTorrents() {
      return {
        title: $(this).text(),
        link: baseUrl + $(this).attr('href'),
        id: $(this).attr('href').match(/\/torrent\/(\d+)/)[1]
      };
    })
    .get();
  });

  return seasons.map(
    (season, index) => ({ title: season, torrents: torrents[index] })
  );
}

export function parseTorrentPage(torrentPage, filter, baseUrl) {
  const $ = cheerio.load(torrentPage);
  const name = $('#title').text().trim();

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
    name,
    size,
    seeders,
    leechers,
    uploadDate,
    magnetLink,
    link,
    id,
    description,
    uploader,
    uploaderLink
  };
}

export function parseTvShows(tvShowsPage) {
  const $ = cheerio.load(tvShowsPage);
  const rawTitles = $('dt a');

  const series = rawTitles.map(function mapTvShow() {
    return {
      title: $(this).text(),
      id: $(this).attr('href').match(/\/tv\/(\d+)/)[1]
    };
  })
  .get();

  const rawSeasons = $('dd');

  const seasons = rawSeasons.map(function mapSeasons() {
    return $(this).find('a').text().match(/S\d+/g);
  });

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
