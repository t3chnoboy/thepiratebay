import Formdata from "form-data";
import querystring from "querystring";
import { baseUrl } from "./constants";
import {
  parsePage,
  parseResults,
  parseTorrentPage,
  parseCommentsPage,
  parseTvShow,
  parseCategories,
  Categories,
  ParsedTvShow
} from "./parser";

type OrderByOpt = "desc" | "asc";
type SortByOpt = "desc" | "asc";

type OrderByOpts = {
  orderBy?: string | "seeds";
  sortBy?: string | "desc" | "asc";
};

type Search = OrderByOpts & {
  page?: string;
  category?: string;
  filter?: {
    verified: boolean;
  };
};

export const defaultOrder: OrderByOpts = { orderBy: "seeds", sortBy: "desc" };

const searchDefaults = {
  category: "0",
  page: "0",
  filter: {
    verified: false
  },
  orderBy: "seeds",
  sortBy: "desc"
};

export const primaryCategoryNumbers: Record<string, number> = {
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
export function convertOrderByObject(
  orderByOpts: OrderByOpts = defaultOrder
): string {
  const options = [
    ["name", "desc"],
    ["name", "asc"],
    ["date", "desc"],
    ["date", "asc"],
    ["size", "desc"],
    ["size", "asc"],
    ["seeds", "desc"],
    ["seeds", "asc"],
    ["leeches", "desc"],
    ["leeches", "asc"]
  ];

  const orderByOptsWithDeafults = {
    ...defaultOrder,
    ...orderByOpts
  };

  // Find the query option
  const option = options.find(
    _option =>
      _option.includes(orderByOptsWithDeafults.orderBy as OrderByOpt) &&
      _option.includes(orderByOptsWithDeafults.sortBy as SortByOpt)
  );

  // Get the index of the query option
  const searchNumber = option ? options.indexOf(option) + 1 : undefined;

  if (!searchNumber) throw Error("Can't find option");

  return String(searchNumber);
}

/**
 * Helper method for parsing page numbers
 */
function castNumberToString(pageNumber?: number | string): string {
  if (typeof pageNumber === "number") {
    return String(pageNumber);
  }

  if (typeof pageNumber === "string") {
    return pageNumber;
  }

  if (typeof pageNumber !== "string" || typeof pageNumber !== "number") {
    throw new Error("Unexpected page number type");
  }

  throw new Error(`Unable to cast ${pageNumber} to string`);
}

/**
 * Determine the category number from an category name ('movies', 'audio', etc)
 */
function resolveCategory(
  categoryParam: number | string,
  defaultCategory: number
): number {
  if (typeof categoryParam === "number") {
    return categoryParam;
  }

  if (typeof categoryParam === "string") {
    if (categoryParam in primaryCategoryNumbers) {
      return primaryCategoryNumbers[categoryParam];
    }
  }

  return defaultCategory;
}

export function search(title = "*", rawOpts: Search = {}) {
  const opts = {
    ...searchDefaults,
    ...rawOpts
  };
  const convertedCategory = resolveCategory(
    opts.category,
    parseInt(searchDefaults.category, 10)
  );

  const castedOptions = {
    ...opts,
    page: opts.page ? castNumberToString(opts.page) : searchDefaults.page,
    category: opts.category
      ? castNumberToString(convertedCategory)
      : searchDefaults.category,
    orderBy: opts.orderBy
      ? castNumberToString(opts.orderBy)
      : searchDefaults.orderBy
  };

  const { page, category, orderBy, sortBy, ...rest } = {
    ...searchDefaults,
    ...castedOptions
  };

  const orderingNumber = convertOrderByObject({ orderBy, sortBy });

  const url = `${baseUrl}/search.php?${querystring.stringify({
    q: title,
    cat: category,
    page,
    orderBy: orderingNumber
  })}`;

  return parsePage(url, parseResults, rest.filter);
}

export function getTorrent(id: string | number | { link: string }) {
  const url = (() => {
    if (typeof id === "object") {
      return id.link;
    }
    return typeof id === "number" || /^\d+$/.test(id)
      ? `${baseUrl}/description.php?id=${id}`
      : // If id is an object return it's link property. Otherwise,
        // return 'id' itself
        id;
  })();

  return parsePage(url, parseTorrentPage);
}

export function getComments(id: number) {
  const url = `${baseUrl}/ajax_details_comments.php`;
  const formData = new Formdata();
  formData.append("id", id);
  return parsePage(url, parseCommentsPage, {}, "POST", formData);
}

export function topTorrents(category = "all") {
  let castedCategory;

  // Check if category is number and can be casted
  if (parseInt(category, 10)) {
    castedCategory = castNumberToString(category);
  }

  return parsePage(
    `${baseUrl}/top/${castedCategory || category}`,
    parseResults
  );
}

export function recentTorrents() {
  return parsePage(`${baseUrl}/recent`, parseResults);
}

export function userTorrents(username: string, opts: Search = {}) {
  // This is the orderingNumber (1 - 10), not a orderBy param, like 'seeds', etc
  let { orderBy } = opts;

  // Determine orderingNumber given orderBy and sortBy
  if (opts.sortBy || opts.orderBy) {
    orderBy = convertOrderByObject({
      sortBy: opts.sortBy || "desc",
      orderBy: opts.orderBy || "seeds"
    });
  }

  const query = `${baseUrl}/user/${username}/?${querystring.stringify({
    page: opts.page ? castNumberToString(opts.page) : "0",
    orderBy: orderBy || "99"
  })}`;

  return parsePage(query, parseResults);
}

/**
 * @TODO: url not longer returning results
 */
export function getTvShow(id: string) {
  return parsePage<ParsedTvShow>(`${baseUrl}/tv/${id}`, parseTvShow);
}

export function getCategories() {
  return parsePage<Categories>(`${baseUrl}/browse.php`, parseCategories);
}

export default {
  search,
  getTorrent,
  getComments,
  topTorrents,
  recentTorrents,
  userTorrents,
  getTvShow,
  getCategories
};
