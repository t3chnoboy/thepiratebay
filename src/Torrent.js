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

export const baseUrl = 'http://thepiratebay.se';


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

export function search(title = '*', opts = {}) {
  const defaults = {
    category: '0',
    page: '0',
    orderby: '99',
  };
  const { config, page, orderBy, category, orderby } = Object.assign({}, defaults, opts);

  const query = {
    url: `${baseUrl}/s/`,
    qs: {
      q: title,
      category,
      page,
      orderby
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
  const query = {
    url: `${baseUrl}/user/${username}`,
    qs: {
      page: opts.page || '0',
      orderby: opts.orderBy || '99'
    }
  };

  return parsePage(query, parseResults);
}

export function tvShows() {
  return parsePage(`${baseUrl}'/tv/all`, parseTvShows);
}

export function getTvShow(id) {
  return parsePage(`${baseUrl}/tv/id`, parseTvShow);
}

export function getCategories() {
  return parsePage(`${baseUrl}/recent`, parseCategories);
}

export default {
  search, getTorrent, topTorrents, recentTorrents, userTorrents, tvShows,
  getTvShow, getCategories
};
