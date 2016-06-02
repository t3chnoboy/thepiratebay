/**
 * @todo: callbackify support
 */
import {
  parsePage,
  parseResults,
  parseTorrentPage,
  parseTvShow,
  parseTvShows,
  parseCategories
} from './Parser';


export const baseUrl = 'https://thepiratebay.se';

/*
 * opts:
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

/**
 * Take a orderBy object and convert it to its according number
 *
 * @example: { orderBy: 'leeches', sortBy: 'asc' }
 * @example: { orderBy: 'name', sortBy: 'desc' }
 */
export function convertOrderByObject(orderByObject) {
  let searchNumber;

  const options = [
    ['name', 'desc'],
    ['name', 'asc'],
    ['date', 'desc'],
    ['date', 'asc'],
    ['size', 'desc'],
    ['size', 'asc'],
    ['seeds', 'desc'],
    ['seeds', 'asc'],
    ['leeches', 'desc'],
    ['leeches', 'asc'],
  ];

  for (const option of options) {
    if (
      option.includes(orderByObject.orderBy) &&
      option.includes(orderByObject.sortBy)
    ) {
      searchNumber = options.indexOf(option) + 1;
      break;
    }
  }

  if (!searchNumber) throw Error("Can't find option");

  return searchNumber;
}

export function search(title = '*', opts = {}) {
  const defaults = {
    category: '0',
    page: '0',
    orderBy: 'seeds',
    sortBy: 'desc',
  };
  const { config, page, category, orderBy, sortBy } = Object.assign({}, defaults, opts);
  const orderingNumber = convertOrderByObject({ orderBy, sortBy });

  const query = {
    url: `${baseUrl}/s/`,
    qs: {
      q: title,
      category,
      page,
      orderby: orderingNumber
    }
  };

  return parsePage(query, parseResults);
}

export function getTorrent(id) {
  const url = (typeof id === Number) || /^\d+$/.test(id)
    ? `${baseUrl}/torrent/${id}`
    : id.link || id;

  return parsePage({ url }, parseTorrentPage);
}

export function topTorrents(category = 'all') {
  return parsePage(`${baseUrl}/top/${category}`, parseResults);
}

export function recentTorrents() {
  return parsePage(`${baseUrl}/recent`, parseResults);
}

export function userTorrents(username, opts = {}) {
  let { orderby } = opts;

  if (opts.sortBy && opts.orderBy) {
    orderby = convertOrderByObject({
      sortBy: opts.sortBy,
      orderBy: opts.orderBy
    });
  }

  const query = {
    url: `${baseUrl}/user/${username}`,
    qs: {
      page: opts.page || '0',
      orderby: orderby || '99'
    }
  };

  return parsePage(query, parseResults);
}

/**
 * @todo: url not longer returning results
 */
export function tvShows() {
  return parsePage(`${baseUrl}'/tv/all`, parseTvShows);
}

/**
 * @todo: url not longer returning results
 */
export function getTvShow(id) {
  return parsePage(`${baseUrl}/tv/${id}`, parseTvShow);
}

export function getCategories() {
  return parsePage(`${baseUrl}/recent`, parseCategories);
}

export default {
  search, getTorrent, topTorrents, recentTorrents, userTorrents, tvShows,
  getTvShow, getCategories
};
