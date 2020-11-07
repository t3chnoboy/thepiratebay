/**
 * Parse all pages
 */
import cheerio from "cheerio";
import UrlParse from "url-parse";
import { baseUrl } from "./constants";
import puppeteer from "puppeteer";

/* eslint promise/no-promise-in-callback: 0, max-len: [2, 200] */

const maxConcurrentRequests = 3;

export type Item = {
  id: string;
  name: string;
  size: string;
  link: string;
  category: string;
  seeders: string;
  leechers: string;
  uploadDate: string;
  magnetLink: string;
  subcategory?: string;
  uploader: string;
  verified?: string;
  description: string;
  uploaderLink: string;
};

export type SubCategory = {
  id: string;
  subcategories: SubCategory;
};

export type Categories = {
  name: string;
  id: string;
  subcategories: SubCategory;
};

/**
 * @private
 */
export function parseTorrentIsVIP(element: Cheerio): boolean {
  return element.find('img[title="VIP"]').attr("title") === "VIP";
}

export function parseTorrentIsTrusted(element: Cheerio): boolean {
  return element.find('img[title="Trusted"]').attr("title") === "Trusted";
}

/**
 * @private
 */
export function isTorrentVerified(element: Cheerio): boolean {
  return parseTorrentIsVIP(element) || parseTorrentIsTrusted(element);
}

export async function getProxyList(): Promise<Array<string>> {
  const response = await fetch("https://proxybay.tv/").then(res => res.text());
  const $ = cheerio.load(response);

  const links = $('[rel="nofollow"]')
    .map(function getElementLinks(_, el) {
      return $(el).attr("href");
    })
    .get()
    .filter((_, index) => index < maxConcurrentRequests);

  return links;
}

export type ParseResult<T> = Array<T> | T;
export type ParseCallback<T> = (
  resultsHTML: string,
  filter?: Record<string, any>
) => ParseResult<T>;

export function parsePage<T>(
  url: string,
  parseCallback: ParseCallback<T>,
  filter: Record<string, any> = {},
  method = "GET",
  formData: string | NodeJS.ReadableStream = ""
): Promise<ParseResult<T>> {
  const attempt = async (error?: string) => {
    if (error) console.log(error);

    const proxyUrls = [
      "https://thepiratebay.org",
      "https://thepiratebay.se",
      "https://pirateproxy.one",
      "https://ahoy.one"
    ];

    const requests = proxyUrls
      .map(
        _url =>
          new UrlParse(url).set("hostname", new UrlParse(_url).hostname).href
      )
      .map(async _url => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(_url)
          .catch(async () => {
            await browser.close();
            new Error(
              "Database maintenance, Cloudflare problems, 403 or 502 error"
            )
          })
        
        const result = await page.$eval('html', (e :any) => e.outerHTML);
        await browser.close();
        return result.includes("502: Bad gateway") ||
          result.includes("403 Forbidden") ||
          result.includes("Database maintenance") ||
          result.includes("Checking your browser before accessing") ||
          result.includes("Origin DNS error")
          ? new Error(
              "Database maintenance, Cloudflare problems, 403 or 502 error"
            )
          : Promise.resolve(result);
      });

    const abandonFailedResponses = (index: number) => {
      const p = requests.splice(index, 1)[0];
      p.catch(() => {});
    };

    const race = (): Promise<string | void | Error> => {
      if (requests.length < 1) {
        console.warn("None of the proxy requests were successful");
        // throw new Error("None of the proxy requests were successful");
      }
      const indexedRequests = requests.map((p, index) =>
        p.catch(() => {
          throw index;
        })
      );
      return Promise.race(indexedRequests).catch(index => {
        abandonFailedResponses(index);
        return race();
      });
    };
    return race();
  };

  return attempt()
    .catch(() => attempt("Failed, retrying"))
    .then(response => parseCallback(response as string, filter));
}

export type ParseOpts = {
  filter?: boolean;
  verified?: boolean;
};

export function parseResults(
  resultsHTML: string,
  filter: ParseOpts = {}
): Array<Item> {
  const $ = cheerio.load(resultsHTML);
  const rawResults = $("ol#torrents li.list-entry");
  
  const results = rawResults.map(function getRawResults(_, el) {
    const name: string =
      $(el)
        .find(".item-title a")
        .text() || "";
    const uploadDate: string =
      $(el)
        ?.find(".item-uploaded")
        ?.text()
    const size: string =
      $(el)
        .find(".item-size")
        .text()
    const seeders: string = $(el)
      .find('.item-seed')
      .first()
      .text();
    const leechers: string = $(el)
      .find('.item-leech')
      .text();
    const relativeLink: string =
      $(el)
        .find(".item-title a")
        .attr("href") || "";
    const link: string = baseUrl + relativeLink;
    const id = String(
      parseInt(/(?:id=)(\d*)/.exec(relativeLink)?.[1] || "", 10)
    );
    const magnetLink: string =
      $(el)
        .find('.item-icons a')
        .first()
        .attr("href") || "";
    const uploader: string = $(el)
      .find(".item-user a")
      .text();
    const uploaderLink: string =
      baseUrl +
      $(el)
        .find(".item-user a")
        .attr("href");
    const verified: boolean = isTorrentVerified($(el));

    const category = {
      id:
        $(el)
          .find(".item-type a")
          .first()
          .attr("href")
          ?.match(/(?:category\:)(\d*)/)?.[1] || "",
      name: $(el)
        .find(".item-type a")
        .first()
        .text()
    };

    const subcategory = {
      id:
        $(el)
          .find(".item-type a")
          .last()
          .attr("href")
          ?.match(/(?:category\:)(\d*)/)?.[1] || "",
      name: $(el)
        .find(".item-type a")
        .last()
        .text()
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

  const parsedResultsArray = results
    .get()
    .filter(result => !result.uploaderLink.includes("undefined"));

  return filter.verified === true
    ? parsedResultsArray.filter(result => result.verified === true)
    : parsedResultsArray;
}

export type Torrent = {
  title: string;
  link: string;
  id: string;
};

export type ParsedTvShow = {
  title: string;
  torrents: Array<Torrent>;
};

export type ParsedTvShowWithSeasons = {
  title: string;
  seasons: string[];
};

export function parseTvShow(tvShowPage: string): Array<ParsedTvShow> {
  const $ = cheerio.load(tvShowPage);
  const seasons: string[] = $("dt a")
    .map((_, el) => $(el).text())
    .get();
  const rawLinks = $("dd");

  const torrents = rawLinks
    .map((_, element) =>
      $(element)
        .find("a")
        .map(() => ({
          title: $(element).text(),
          link: baseUrl + $(element).attr("href"),
          id: $(element)
            .attr("href")
            ?.match(/\/torrent\/(\d+)/)?.[1]
        }))
        .get()
    )
    .get();

  return seasons.map((season, index) => ({
    title: season,
    torrents: torrents[index]
  }));
}

export function parseTorrentPage(torrentPage: string): Item {
  const $ = cheerio.load(torrentPage);
  const name = $("#title")
    .text()
    .trim();

  const size = $("dt:contains(Size:) + dd")
    .text()
    .trim();
  const uploadDate = $("dt:contains(Uploaded:) + dd")
    .text()
    .trim();
  const uploader = $("dt:contains(By:) + dd")
    .text()
    .trim();
  const uploaderLink = baseUrl + $("dt:contains(By:) + dd a").attr("href");
  const seeders = $("dt:contains(Seeders:) + dd")
    .text()
    .trim();
  const leechers = $("dt:contains(Leechers:) + dd")
    .text()
    .trim();
  const id = $("input[name=id]").attr("value") || "";
  const link = `${baseUrl}/torrent/${id}`;
  const magnetLink = $('a[title="Get this torrent"]').attr("href") || "";
  const description =
    $("div.nfo")
      .text()
      .trim() || "";

  return {
    category: "",
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

export function parseTvShows(tvShowsPage: string): ParsedTvShowWithSeasons[] {
  const $ = cheerio.load(tvShowsPage);
  const rawTitles = $("dt a");
  const series = rawTitles
    .map((_, element) => ({
      title: $(element).text(),
      id: $(element)
        .attr("href")
        ?.match(/\/tv\/(\d+)/)?.[1]
    }))
    .get();

  const rawSeasons: Cheerio = $("dd");
  const seasons = rawSeasons
    .map((_, element) =>
      $(element)
        .find("a")
        .text()
        .match(/S\d+/g)
    )
    .get();

  return series.map((s, index) => ({
    title: s.title,
    id: s.id,
    seasons: seasons[index]
  }));
}

export function parseCategories(categoriesHTML: string): Array<Categories> {
  const $ = cheerio.load(categoriesHTML);
  const categoriesContainer = $("select#category optgroup");
  let currentCategoryId = 0;

  const categories = categoriesContainer.map((_, el) => {
    currentCategoryId += 100;

    const category: {
      name: string;
      id: string;
      subcategories: Array<{
        id: string;
        name: string;
      }>;
    } = {
      name: $(el).attr("label") || "",
      id: `${currentCategoryId}`,
      subcategories: []
    };

    $(el)
      .find("option")
      .each(function getSubcategory() {
        category.subcategories.push({
          id: $(el).attr("value") || "",
          name: $(el).text()
        });
      });

    return category;
  });

  return categories.get();
}

export type ParseCommentsPage = {
  user: string;
  comment: string;
};

export function parseCommentsPage(
  commentsHTML: string
): Array<ParseCommentsPage> {
  const $ = cheerio.load(commentsHTML);

  const comments = $.root()
    .contents()
    .map((_, el) => {
      const comment = $(el)
        .find("div.comment")
        .text()
        .trim();
      const user = $(el)
        .find("a")
        .text()
        .trim();

      return {
        user,
        comment
      };
    });

  return comments.get();
}
