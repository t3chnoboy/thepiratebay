// @flow
import querystring from 'querystring';
import {
  parsePage,
  parseResults,
  parseTorrentPage,
  parseTvShow,
  parseCategories
} from './Parser';


export const baseUrl = process.env.THEPIRATEBAY_DEFAULT_ENDPOINT || 'https://thepiratebay.org';

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
export function convertOrderByObject(orderByObject: Object = defaultOrder) {
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

  // Find the query option
  const option = options.find(_option =>
    _option.includes(orderByObject.orderBy) &&
    _option.includes(orderByObject.sortBy)
  );

  // Get the index of the query option
  const searchNumber = option
    ? options.indexOf(option) + 1
    : undefined;

  if (!searchNumber) throw Error("Can't find option");

  return searchNumber;
}

/**
 * Helper method for parsing page numbers
 */
function castNumberToString(pageNumber: number | string): string {
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

  throw new Error(`Unable to cast ${pageNumber} to string`);
}

/**
 * Determine the category number from an category name ('movies', 'audio', etc)
 */
function resolveCategory(categoryParam: number | string): number {
  if (
    typeof categoryParam === 'string' &&
    categoryParam in primaryCategoryNumbers
  ) {
    return primaryCategoryNumbers[categoryParam];
  }

  throw new Error(`Cannot resolve category: '${categoryParam}'`);
}

function search(title: string = '*', opts: Object = {}) {
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
    ...rest
  } = { ...searchDefaults, ...castedOptions };

  const orderingNumber = convertOrderByObject({ orderBy, sortBy });

  const url = `${baseUrl}/s/?${querystring.stringify({
    q: title,
    category,
    page,
    orderby: orderingNumber
  })}`;

  return parsePage(url, parseResults, rest.filter);
}

function getTorrent(id: string | Object) {
  const url = typeof id === 'number' || /^\d+$/.test(id)
    ? `${baseUrl}/torrent/${id}`
    : id.link || id;

  return parsePage(url, parseTorrentPage);
}

function topTorrents(category: string = 'all') {
  let castedCategory;

  // Check if category is number and can be casted
  if (parseInt(category, 10)) {
    castedCategory = castNumberToString(category);
  }

  return parsePage(`${baseUrl}/top/${castedCategory || category}`, parseResults);
}

function recentTorrents() {
  return parsePage(`${baseUrl}/recent`, parseResults);
}

function userTorrents(username: string, opts: Object = {}) {
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
 * @TODO: url not longer returning results
 */
function getTvShow(id: string) {
  return parsePage(`${baseUrl}/tv/${id}`, parseTvShow);
}

function getCategories() {
  return parsePage(`${baseUrl}/recent`, parseCategories);
}

export default {
  search,
  getTorrent,
  topTorrents,
  recentTorrents,
  userTorrents,
  getTvShow,
  getCategories,
  baseUrl,
  searchDefaults,
  defaultOrder
};
