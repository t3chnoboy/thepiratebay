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
import querystring from 'querystring';

export const baseUrl = 'https://thepiratebay.se';

export const defaultOrder = { orderBy: 'seeds', sortBy: 'desc' };

export const primaryCategoryNumbers = {
  audio: 100,
  video: 200,
  applications: 300,
  games: 400,
  xxx: 500,
  other: 600
};

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
export function convertOrderByObject(orderByObject = defaultOrder) {
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
    ['leeches', 'asc']
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

/**
 * Helper method for parsing page numbers
 *
 * @param  {number} pageNumber
 * @return {string}
 */
function castNumberToString(pageNumber) {
  if (typeof pageNumber === 'number') {
    return String(pageNumber);
  }

  if (typeof pageNumber === 'string') {
    return pageNumber;
  }

  if (
    typeof pageNumber !== 'string' ||
    typeof pageNumber !== 'number'
  ) {
    throw new Error('Unexpected page number type');
  }
}

/**
 * Determine the category number from an category name ('movies', 'audio', etc)
 *
 * @param  {number} || {string}
 * @return {number}
 */
function resolveCategory(categoryParam) {
  if (
    typeof categoryParam === 'string' &&
    categoryParam in primaryCategoryNumbers
  ) {
    return primaryCategoryNumbers[categoryParam];
  }

  return categoryParam;
}

export function search(title = '*', opts = {}) {
  const defaults = {
    category: '0',
    page: '0',
    filter: {
      verified: true
    },
    orderBy: 'seeds',
    sortBy: 'desc'
  };

  const convertedCategory = resolveCategory(opts.category);

  const castedOptions = {
    ...opts,
    page: opts.page ? castNumberToString(opts.page) : defaults.page,
    category: opts.category ? castNumberToString(convertedCategory) : defaults.category,
    orderby: opts.orderby ? castNumberToString(opts.orderby) : defaults.orderby
  };

  const {
    page,
    category,
    orderBy,
    sortBy,
    ...rest
  } = { ...defaults, ...castedOptions };

  const orderingNumber = convertOrderByObject({ orderBy, sortBy });

  const url = `${baseUrl}/s/?${querystring.stringify({
    q: title,
    category,
    page,
    orderby: orderingNumber
  })}`;

  return parsePage(url, parseResults, rest.filter);
}

export function getTorrent(id) {
  const url = (typeof id === Number) || /^\d+$/.test(id)
    ? `${baseUrl}/torrent/${id}`
    : id.link || id;

  return parsePage(url, parseTorrentPage);
}

export function topTorrents(category = 'all') {
  let castedCategory;

  // Check if category is number and can be casted
  if (parseInt(category, 10)) {
    castedCategory = castNumberToString(category);
  }

  return parsePage(`${baseUrl}/top/${castedCategory || category}`, parseResults);
}

export function recentTorrents() {
  return parsePage(`${baseUrl}/recent`, parseResults);
}

export function userTorrents(username, opts = {}) {
  // This is the orderingNumber (1 - 10), not a orderBy param, like 'seeds', etc
  let { orderby } = opts;

  // Determine orderingNumber given orderBy and sortBy
  if (opts.sortBy || opts.orderBy) {
    orderby = convertOrderByObject({
      sortBy: opts.sortBy || 'desc',
      orderBy: opts.orderBy || 'seeds'
    });
  }

  const query = `${baseUrl}/user/${username}/?${querystring.stringify({
    page: opts.page ? castNumberToString(opts.page) : '0',
    orderby: orderby || '99'
  })}`;

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
