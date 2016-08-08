import querystring from 'querystring';
import {
  parsePage,
  parseResults,
  parseTorrentPage,
  parseTvShow,
  parseTvShows,
  parseCategories
} from './Parser';


export const defaultOrder = { orderBy: 'seeds', sortBy: 'desc' };

const searchDefaults = {
  category: '0',
  page: '0',
  filter: {
    verified: false
  },
  orderBy: 'seeds',
  sortBy: 'desc'
};

export const primaryCategoryNumbers = {
  audio: 100,
  video: 200,
  applications: 300,
  games: 400,
  xxx: 500,
  other: 600
};

const defaultOpts = {
  baseUrl: 'https://thepiratebay.org',
  sortBy: 'desc',
  orderBy: 'seeds',
  page: '0'
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

  throw new Error('Unexpected page number type');
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

function search(title = '*', opts = {}) {
  const convertedCategory = resolveCategory(opts.category);

  const castedOptions = {
    ...opts,
    page: opts.page ? castNumberToString(opts.page) : searchDefaults.page,
    category: opts.category ? castNumberToString(convertedCategory) : searchDefaults.category,
    orderby: opts.orderby ? castNumberToString(opts.orderby) : searchDefaults.orderby
  };

  const {
    page,
    category,
    orderBy,
    sortBy,
    baseUrl,
    ...rest
  } = { ...defaultOpts, ...searchDefaults, ...castedOptions };

  const orderingNumber = convertOrderByObject({ orderBy, sortBy });

  const url = `${baseUrl}/s/?${querystring.stringify({
    q: title,
    category,
    page,
    orderby: orderingNumber
  })}`;

  return parsePage(url, parseResults, rest.filter, opts);
}

function getTorrent(id, opts) {
  const { baseUrl } = _handleOpts(opts);
  const url = (typeof id === Number) || /^\d+$/.test(id)
    ? `${baseUrl}/torrent/${id}`
    : id.link || id;

  return parsePage(url, parseTorrentPage, opts);
}

function topTorrents(category = 'all', opts) {
  const { baseUrl } = _handleOpts(opts);
  let castedCategory;

  // Check if category is number and can be casted
  if (parseInt(category, 10)) {
    castedCategory = castNumberToString(category);
  }

  return parsePage(`${baseUrl}/top/${castedCategory || category}`, parseResults, opts);
}

function recentTorrents(opts) {
  const { baseUrl } = _handleOpts(opts);
  return parsePage(`${baseUrl}/recent`, parseResults, opts);
}

function userTorrents(username, opts) {
  // This is the orderingNumber (1 - 10), not a orderBy param, like 'seeds', etc
  const { orderBy, sortBy, baseUrl, page } = _handleOpts(opts);
  const _orderBy = convertOrderByObject({ sortBy, orderBy });

  const query = `${baseUrl}/user/${username}/?${querystring.stringify({
    page: castNumberToString(page),
    orderby: _orderBy || '99'
  })}`;

  return parsePage(query, parseResults, opts);
}

/**
 * @todo: url not longer returning results
 */
function tvShows(opts) {
  const { baseUrl } = _handleOpts(opts);
  return parsePage(`${baseUrl}'/tv/all`, parseTvShows, opts);
}

/**
 * @todo: url not longer returning results
 */
function getTvShow(id, opts) {
  const { baseUrl } = _handleOpts(opts);
  return parsePage(`${baseUrl}/tv/${id}`, parseTvShow, opts);
}

function getCategories(opts) {
  const { baseUrl } = _handleOpts(opts);
  return parsePage(`${baseUrl}/recent`, parseCategories, opts);
}

function _handleOpts(opts = {}) {
  return { ...defaultOpts, ...opts };
}

export default {
  search,
  getTorrent,
  topTorrents,
  recentTorrents,
  userTorrents,
  tvShows,
  getTvShow,
  getCategories,
  searchDefaults,
  defaultOrder
};
