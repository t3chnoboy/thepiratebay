// /**
//  * @todo: callbackify support
//  */
//
// import request from 'request';
// import cheerio from 'cheerio';
// import zlib from 'zlib';
// import { parsePage, parseResults } from './src/Parser';
//
// const baseUrl = 'http://thepiratebay.se';
//
// /*
// *opts:
// *  category
// *    0   - all
// *    101 - 699
// *  page
// *    0 - 99
// *  orderBy
// *     1  - name desc
// *     2  - name asc
// *     3  - date desc
// *     4  - date asc
// *     5  - size desc
// *     6  - size asc
// *     7  - seeds desc
// *     8  - seeds asc
// *     9  - leeches desc
// *     10 - leeches asc
// */
//
// export function search(title = '*', opts = {}) {
//   const { config, page, orderBy, category, orderby } = Object.assign({}, {
//     category: '0',
//     page: '0',
//     orderby: '99',
//   }, opts);
//
//   const query = {
//     url: `${baseUrl}/s/`,
//     qs: {
//       q: title,
//       category,
//       page,
//       orderby
//     }
//   };
//
//   return parsePage(query, parseResults);
// }
//
// export function getTorrent(id) {
//   const url = (typeof id === Number) || /^\d+$/.test(id)
//     ? `${baseUrl}/torrent/${id}`
//     : id.link || id;
//
//   return parsePage({ url }, parseTorrentPage);
// }
//
// export function topTorrents(category = 'all') {
//   return parsePage(`${baseUrl}'/top/'${category}`, parseResults);
// }
//
// export function recentTorrents(cb) {
//   return parsePage(baseUrl + '/recent', parseResults);
// }
//
// export function userTorrents(username, opts = {}) {
//   const query = {
//     url: `${baseUrl}/user/${username}`,
//     qs: {
//       page: opts.page || '0',
//       orderby: opts.orderBy || '99'
//     }
//   };
//
//   return parsePage(query, parseResults);
// }
//
// export function tvShows(cb) {
//   return parsePage(baseUrl + '/tv/all', parseTvShows);
// }
//
// export function getTvShow(id) {
//   return parsePage(baseUrl + '/tv/' + id, parseTvShow);
// }
//
// export function getCategories(cb) {
//   return parsePage(baseUrl + '/recent', parseCategories);
// };
//
// export function requestWithEncoding(options, callback) {
//   var req = request(options);
//
//   req.on('response', function(res) {
//     var chunks = [];
//     res.on('data', function(chunk) {
//       chunks.push(chunk);
//     });
//
//     res.on('end', function() {
//       var buffer = Buffer.concat(chunks);
//       var encoding = res.headers['content-encoding'];
//       if (encoding == 'gzip') {
//         zlib.gunzip(buffer, function(err, decoded) {
//           callback(err, decoded && decoded.toString());
//         });
//       } else if (encoding == 'deflate') {
//         zlib.inflate(buffer, function(err, decoded) {
//           callback(err, decoded && decoded.toString());
//         })
//       } else {
//         callback(null, buffer.toString());
//       }
//     });
//   });
//
//   req.on('error', function(err) {
//     callback(err);
//   });
// }
//
// export function parseCategories(categoriesHTML) {
//   var $, categories, categoriesContainer, currentCategoryId;
//   $ = cheerio.load(categoriesHTML);
//   categoriesContainer = $('select#category optgroup');
//   currentCategoryId = 0;
//   categories = categoriesContainer.map(function(elem) {
//     var category;
//     currentCategoryId += 100;
//     category = {
//       name: $(this).attr('label'),
//       id: currentCategoryId + '',
//       subcategories: []
//     };
//     $(this).find('option').each(function(opt) {
//       var subcategory;
//       subcategory = {
//         id: $(this).attr('value'),
//         name: $(this).text()
//       };
//       return category.subcategories.push(subcategory);
//     });
//     return category;
//   });
//   return categories.get();
// };
//
//
// export function parseTvShows(tvShowsPage) {
//   var $, rawResults, results = [];
//   $ = cheerio.load(tvShowsPage);
//   rawTitles = $('dt a');
//   series = rawTitles.map(function(elem) {
//     return {
//       title: $(this).text(),
//       id: $(this).attr('href').match(/\/tv\/(\d+)/)[1]
//     };
//   }).get();
//
//   rawSeasons = $('dd');
//   var seasons = []
//
//   rawSeasons.each(function(elem) {
//     seasons.push($(this).find('a')
//     .text()
//     .match(/S\d+/g));
//   });
//
//   series.forEach(function(s, index){
//     results.push({
//       title: s.title,
//       id: s.id,
//       seasons: seasons[index]
//     });
//   });
//
//   return results;
// }
//
//
// export function parseTvShow(tvShowPage) {
//   var $, rawResults, results = [], seasons = [], torrents = [];
//   $ = cheerio.load(tvShowPage);
//
//   seasons = $('dt a').map(function(elem) {
//     return $(this).text();
//   }).get();
//
//   rawLinks = $('dd');
//
//   rawLinks.each(function(elem) {
//     torrents.push($(this).find('a').map(function(link){
//       return {
//         title: $(this).text(),
//         link: (baseUrl + $(this).attr('href')),
//         id: $(this).attr('href').match(/\/torrent\/(\d+)/)[1]
//       }
//     }).get());
//   });
//
//   seasons.forEach(function(s, index){
//     results.push({
//       title: s,
//       torrents: torrents[index]
//     });
//   });
//
//   return results;
// }
//
// export function parseTorrentPage(torrentPage) {
//   var $, filesCount, leechers, name, seeders, size, torrent, uploadDate;
//   $ = cheerio.load(torrentPage);
//   name = $('#title').text().trim();
//   // filesCount = parseInt($('a[title="Files"]').text());
//   size = $('dt:contains(Size:) + dd').text().trim();
//   uploadDate = $('dt:contains(Uploaded:) + dd').text().trim();
//   uploader = $('dt:contains(By:) + dd').text().trim();
//   uploaderLink = baseUrl + $('dt:contains(By:) + dd a').attr('href');
//   seeders = $('dt:contains(Seeders:) + dd').text().trim();
//   leechers = $('dt:contains(Leechers:) + dd').text().trim();
//   id = $('input[name=id]').attr('value');
//   link = baseUrl + '/torrent/' + id
//   magnetLink = $('a[title="Get this torrent"]').attr('href');
//   torrentLink = $('a[title="Torrent File"]').attr('href');
//   description = $('div.nfo').text().trim();
//   picture = 'http:' + $('img[title="picture"]').attr('src');
//
//   return {
//     name, size, seeders, leechers, uploadDate, torrentLink, magnetLink, link,
//     id, description, picture, uploader, uploaderLink
//   };
// };
