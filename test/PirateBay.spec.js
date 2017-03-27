/**
 * Test all high level methods
 *
 * @TODO: Reduced the number of api calls by querying once and running multiple
 *        tests against that query. ideally, this would be done in a 'before'
 *        function
 */
import { expect } from 'chai';
import { parseCategories, parsePage, getProxyList } from '../src/Parser';
import Torrent, { baseUrl, convertOrderByObject } from '../src/PirateBay';


/* eslint no-unused-expressions: 0, import/no-named-as-default-member: 0 */

const testingUsername = 'YIFY';

function torrentFactory() {
  return Torrent.getTorrent('10676856');
}

function torrentSearchFactory() {
  return Torrent.search('Game of Thrones', {
    category: '205'
  });
}

function torrentCategoryFactory() {
  return Torrent.getCategories();
}

function greaterThanOrEqualTo(first, second) {
  return (first > second || first === second);
}

function lessThanOrEqualToZero(first, second) {
  return (first < second || first === 0);
}

function assertHasArrayOfTorrents(arrayOfTorrents) {
  expect(arrayOfTorrents).to.be.an('array');
  expect(arrayOfTorrents[0]).to.be.an('object');
}

/**
 * todo: test the 'torrentLink' property, which is undefined in many queries
 */
function assertHasNecessaryProperties(torrent, additionalProperties = []) {
  const defaultPropertiesToValidate = [
    'id', 'name', 'size', 'link', 'category', 'seeders', 'leechers',
    'uploadDate', 'magnetLink', 'subcategory', 'uploader', 'verified',
    'uploaderLink', ...additionalProperties
  ];

  for (const property of defaultPropertiesToValidate) {
    expect(torrent).to.have.property(property);
    expect(torrent[property]).to.exist;
    if (typeof torrent[property] === 'string') {
      expect(torrent[property]).to.not.contain('undefined');
    }
  }
}

describe('Torrent', () => {
  describe('order object to number converter', () => {
    it('should convert orderBy and sortBy with name', () => {
      const searchNumber = convertOrderByObject({
        orderBy: 'name',
        sortBy: 'asc'
      });
      expect(searchNumber).to.equal(2);
    });

    it('should convert orderBy and sortBy with leechers', () => {
      const searchNumber = convertOrderByObject({
        orderBy: 'leeches',
        sortBy: 'desc'
      });
      expect(searchNumber).to.equal(9);
    });
  });

  describe('categories', function () {
    beforeAll(async () => {
      this.categories = await torrentCategoryFactory();
    });

    it('retrieves categories', async () => {
      expect(this.categories).to.be.an('array');
    });

    it('retrieves categories with expected properties', async () => {
      const properties = ['name', 'id', 'subcategories'];
      for (const property of properties) {
        expect(this.categories[0]).to.have.property(property);
        expect(this.categories[0][property]).to.exist;
        expect(this.categories[0][property]).to.not.contain('undefined');
      }
    });
  });

  /**
   * @todo
   *
   * it('searches by page number', async () => {});
   * it('searches by category', async () => {});
   */
  describe('search', function () {
    beforeAll(async () => {
      this.search = await torrentSearchFactory();
    });

    it('searches for items', async () => {
      assertHasArrayOfTorrents(this.search);
    });

    it('should have verified property', () => {
      expect(this.search[0]).to.have.property('verified');
      expect(this.search[0].verified).to.be.a('boolean');
    });

    it.concurrent('should search un-verified', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        filter: {
          verified: false
        }
      });

      for (const result of searchResults) {
        expect(result).to.have.property('verified').that.is.a('boolean');
      }
    });

    /**
     * Assert by searching wrong
     */
    it.skip('should search using primary category names', async function getCategoryNames() {
      this.timeout(50000);

      const searchResults = await Promise.all([
        Torrent.search('Game of Thrones', {
          category: 'applications'
        }),
        Torrent.search('Game of Thrones', {
          category: 'audio'
        }),
        Torrent.search('Game of Thrones', {
          category: 'video'
        }),
        Torrent.search('Game of Thrones', {
          category: 'games'
        }),
        Torrent.search('Game of Thrones', {
          category: 'xxx'
        }),
        Torrent.search('Game of Thrones', {
          category: 'other'
        })
      ]);

      expect(searchResults[0][0].category.name).to.equal('Applications');
      expect(searchResults[1][0].category.name).to.equal('Audio');
      expect(searchResults[2][0].category.name).to.equal('Video');
      expect(searchResults[3][0].category.name).to.equal('Games');
      expect(searchResults[4][0].category.name).to.equal('Porn');
      expect(searchResults[5][0].category.name).to.equal('Other');
    });

    it.concurrent('should handle numerical values', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        page: 1,
        orderBy: 'seeds',
        sortBy: 'asc'
      });
      assertHasNecessaryProperties(searchResults[0]);
    });

    it.concurrent('should handle non-numerical values', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: 'all',
        page: '1',
        orderBy: 'seeds',
        sortBy: 'asc'
      });
      assertHasNecessaryProperties(searchResults[0]);
    });

    it.concurrent('should search with backwards compatible method', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        orderby: '8' // Search orderby seeds, asc
      });
      assertHasNecessaryProperties(searchResults[0]);
      lessThanOrEqualToZero(searchResults[0].seeders, searchResults[1].seeders);
      lessThanOrEqualToZero(searchResults[1].seeders, searchResults[2].seeders);
      lessThanOrEqualToZero(searchResults[3].seeders, searchResults[3].seeders);
    });

    it('retrieves expected properties', async () => {
      assertHasNecessaryProperties(this.search[0]);
    });

    it.concurrent('searches by sortBy: desc', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        orderBy: 'seeds',
        sortBy: 'desc'
      });

      greaterThanOrEqualTo(searchResults[0].seeders, searchResults[1].seeders);
      greaterThanOrEqualTo(searchResults[1].seeders, searchResults[2].seeders);
      greaterThanOrEqualTo(searchResults[3].seeders, searchResults[3].seeders);
    });

    it.concurrent('searches by sortBy: asc', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        orderBy: 'seeds',
        sortBy: 'asc'
      });

      lessThanOrEqualToZero(searchResults[0].seeders, searchResults[1].seeders);
      lessThanOrEqualToZero(searchResults[1].seeders, searchResults[2].seeders);
      lessThanOrEqualToZero(searchResults[3].seeders, searchResults[3].seeders);
    });

    it.concurrent('should get torrents, strict', async () => {
      const searchResults = await Promise.all([
        Torrent.search('Game of Thrones S01E08'),
        Torrent.search('Game of Thrones S02E03'),
        Torrent.search('Game of Thrones S03E03')
      ]);

      for (const result of searchResults) {
        expect(result).to.have.length.above(10);
        expect(result[0])
            .to.have.deep.property('seeders')
            .that.is.greaterThan(20);
      }
    });
  });

  /**
   * Get torrent types
   */
  describe('torrent types', () => {
    it.concurrent('should get top torrents', async () => {
      const torrents = await Torrent.topTorrents();
      assertHasArrayOfTorrents(torrents);
      assertHasNecessaryProperties(torrents[0]);
      expect(torrents.length === 100).to.be.true;
    });

    it.concurrent('should get recent torrents', async () => {
      const torrents = await Torrent.recentTorrents();
      assertHasArrayOfTorrents(torrents);
      assertHasNecessaryProperties(torrents[0]);
      expect(torrents).to.have.length.above(20);
    });

    it.concurrent('should get users torrents', async () => {
      const torrents = await Torrent.userTorrents(testingUsername);
      assertHasArrayOfTorrents(torrents);
      assertHasNecessaryProperties(torrents[0]);
    });
  });

  //
  // Original tests
  //

  /**
   * Get torrents
   */
  describe('Torrent.getTorrent(id)', function () {
    beforeAll(async () => {
      this.torrent = await torrentFactory();
    });

    it('should have no undefined properties', () => {
        for (const property in this.torrent) { // eslint-disable-line
          if (this.torrent.hasOwnProperty(property)) {
            if (typeof this.torrent[property] === 'string') {
              expect(this.torrent[property]).to.not.include('undefined');
            }
          }
        }
    });

    it('should return a promise', () => {
      expect(torrentFactory()).to.be.a('promise');
    });

    it('should have a name', () => {
      expect(this.torrent).to.have.property(
          'name',
          'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY'
        );
    });

    it('should have uploader', () => {
      expect(this.torrent).to.have.property('uploader', 'YIFY');
    });

    it('should have uploader link', () => {
      expect(this.torrent).to.have.property('uploaderLink', `${baseUrl}/user/YIFY/`);
    });

    it('should have an id', () => {
      expect(this.torrent).to.have.property('id', '10676856');
    });

    it('should have upload date', () => {
      expect(this.torrent).to.have.property('uploadDate', '2014-08-02 08:15:25 GMT');
    });

    it('should have size', () => {
      expect(this.torrent).to.have.property('size');
      expect(this.torrent.size).to.match(/\d+\.\d+\s(G|M|K)iB/);
    });

    it('should have seeders and leechers count', () => {
      expect(this.torrent).to.have.property('seeders');
      expect(this.torrent).to.have.property('leechers');
      expect(~~this.torrent.leechers).to.be.above(-1);
      expect(~~this.torrent.seeders).to.be.above(-1);
    });

    it('should have a link', () => {
      expect(this.torrent).to.have.property('link', `${baseUrl}/torrent/10676856`);
    });

    it('should have a magnet link', () => {
      expect(this.torrent).to.have.property('magnetLink');
    });

    it('should have a description', () => {
      expect(this.torrent).to.have.property('description');
      expect(this.torrent.description).to.be.a('string');
    });
  });

  /**
   * Search
   */
  describe('Torrent.search(title, opts)', function () {
    beforeAll(async () => {
      this.searchResults = await Torrent.search('Game of Thrones');
      this.fistSearchResult = this.searchResults[0];
    });

    it('should return a promise', () => {
      expect(Torrent.search('Game of Thrones')).to.be.a('promise');
    });

    it('should return an array of search results', () => {
      expect(this.searchResults).to.be.an('array');
    });

    describe('search result', () => {
      it('should have an id', () => {
        expect(this.fistSearchResult).to.have.property('id');
        expect(this.fistSearchResult.id).to.match(/^\d+$/);
      });

      it('should have a name', () => {
        expect(this.fistSearchResult).to.have.property('name');
        expect(this.fistSearchResult.name).to.match(/game.of.thrones/i);
      });

      it('should have upload date', () => {
        expect(this.fistSearchResult).to.have.property('uploadDate');
          /**
            * Valid dates:
            *  31 mins ago
            *  Today 02:18
            *  Y-day 22:14
            *  02-10 03:36
            *  06-21 2011
            */
        expect(this.fistSearchResult.uploadDate)
            .to
            .match(
              /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
            );
      });

      it('should have size', () => {
        expect(this.fistSearchResult).to.have.property('size');
          /**
            * Valid sizes:
            *  529.84 MiB
            *  2.04 GiB
            *  598.98 KiB
            */
        expect(this.fistSearchResult.size).to.exist;
      });

      it('should have seeders and leechers count', () => {
        expect(this.fistSearchResult).to.have.property('seeders');
        expect(this.fistSearchResult).to.have.property('leechers');
        expect((~~this.fistSearchResult.leechers)).to.be.above(-1);
        expect((~~this.fistSearchResult.seeders)).to.be.above(-1);
      });

      it('should have a link', () => {
        expect(this.fistSearchResult).to.have.property('link');
        expect(this.fistSearchResult.link).to.match(
            new RegExp(`${baseUrl}/torrent/\\d+/+`)
          );
      });

      it('should have a magnet link', () => {
        expect(this.fistSearchResult).to.have.property('magnetLink');
        expect(this.fistSearchResult.magnetLink).to.match(/magnet:\?xt=.+/);
      });

      it('should have a category', () => {
        expect(this.fistSearchResult).to.have.property('category');
        expect(this.fistSearchResult.category.id).to.match(/[1-6]00/);
        expect(this.fistSearchResult.category.name).to.match(/\w+/);
      });

      it('should have a subcategory', () => {
        expect(this.fistSearchResult).to.have.property('subcategory');
        expect(this.fistSearchResult.subcategory.id).to.match(/[1-6][09][1-9]/);
        expect(this.fistSearchResult.subcategory.name).to.match(/[a-zA-Z0-9 ()/-]/);
      });

      it('should have an uploader and uploader link', () => {
        expect(this.fistSearchResult).to.have.property('uploader');
        expect(this.fistSearchResult).to.have.property('uploaderLink');
      });
    });
  });

  describe('Torrent.topTorrents(category, opts)', function () {
    beforeAll(async () => {
      this.topTorrents = await Torrent.topTorrents('205');
    });

    it('should return a promise', () => {
      expect(Torrent.topTorrents('205')).to.be.a('promise');
    });

    it.concurrent('should handle numeric input', async () => {
      const topTorrents = await Torrent.topTorrents(205);
      expect(topTorrents).to.be.an('array');
      expect(topTorrents[0].category.name).to.be.equal('Video');
      expect(topTorrents[0].subcategory.name).to.be.equal('TV shows');
    });

    it('should return an array of top torrents of the selected category', () => {
      expect(this.topTorrents).to.be.an('array');
    });

    describe('search result', () => {
      it('category and subcategory shoud match specified category', () => {
        expect(this.topTorrents[0].category.name).to.be.equal('Video');
        expect(this.topTorrents[0].subcategory.name).to.be.equal('TV shows');
      });
    });
  });

  describe('Torrent.recentTorrents()', function testRecentTorrents() {
    beforeAll(async () => {
      this.recentTorrents = await Torrent.recentTorrents();
    });

    it('should return a promise', () => {
      expect(Torrent.recentTorrents()).to.be.a('promise');
    });

    it('should return an array of the most recent torrents', () => {
      expect(this.recentTorrents).to.be.an('array');
    });

    describe('recent torrent', () => {
      it('should be uploaded recently', () => {
        const [recentTorrent] = this.recentTorrents;
        expect(recentTorrent.uploadDate).to.exist;
      });
    });
  });

  describe('Torrent.getCategories()', function testGetCategories() {
    beforeAll(async () => {
      this.categories = await torrentCategoryFactory();
      this.subcategory = this.categories[0].subcategories[0];
    });

    it('should return promise', () => {
      expect(parsePage(`${baseUrl}/recent`, parseCategories)).to.be.a('promise');
    });

    it('should return an array of categories', () => {
      expect(this.categories).to.be.an('array');
    });

    describe('category', () => {
      it('should have an id', () => {
        expect(this.categories[0]).to.have.property('id');
        expect(this.categories[0].id).to.match(/\d00/);
      });

      it('should have a name', () => {
        expect(this.categories[0]).to.have.property('name');
        expect(this.categories[0].name).to.be.a('string');
      });

      it('name should match id', () => {
        const video = this.categories.find((elem) => elem.name === 'Video');
        expect(video.id).to.equal('200');
      });

      it('shold have subcategories array', () => {
        expect(this.categories[0]).to.have.property('subcategories');
        expect(this.categories[0].subcategories).to.be.an('array');
      });

      describe('subcategory', () => {
        it('should have an id', () => {
          expect(this.subcategory).to.have.property('id');
          expect(this.subcategory.id).to.match(/\d{3}/);
        });

        it('should have a name', () => {
          expect(this.subcategory).to.have.property('name');
          expect(this.subcategory.name).to.be.a('string');
        });
      });
    });
  });

  /**
   * User torrents
   */
  describe('Torrent.userTorrents(userName, opts)', function testUserTorrents() {
    beforeAll(async () => {
      this.userTorrents = await Torrent.userTorrents('YIFY');
    });

    it('should return a promise', () => {
      expect(Torrent.userTorrents('YIFY')).to.be.a('promise');
    });

    it('should return an array of the user torrents', () => {
      expect(this.userTorrents).to.be.an('array');
    });

    describe('user torrent', () => {
      it('should have a name', () => {
        expect(this.userTorrents[0]).to.have.property('name');
      });

      it('should have upload date', () => {
        expect(this.userTorrents[0]).to.have.property('uploadDate');
          /*
            * Valid dates:
            *  31 mins ago
            *  Today 02:18
            *  Y-day 22:14
            *  02-10 03:36
            *  06-21 2011
                  */
        expect(this.userTorrents[0].uploadDate)
            .to
            .match(
              /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
            );
      });

      it('should have size', () => {
        expect(this.userTorrents[0]).to.have.property('size');
          /*
            * Valid sizes:
            *  529.84 MiB
            *  2.04 GiB
            *  598.98 KiB
                  */
        expect(this.userTorrents[0].size).to.match(/\d+\.\d+\s(G|M|K)iB/);
      });

      it('should have seeders and leechers count', () => {
        expect(this.userTorrents[0]).to.have.property('seeders');
        expect(this.userTorrents[0]).to.have.property('leechers');
        expect((~~this.userTorrents[0].leechers)).to.be.above(-1);
        expect((~~this.userTorrents[0].seeders)).to.be.above(-1);
      });

      it('should have a link', () => {
        expect(this.userTorrents[0]).to.have.property('link');
        expect(this.userTorrents[0].link).to.match(new RegExp(`${baseUrl}/torrent/\\d+/+`));
      });

      it('should have a magnet link', () => {
        expect(this.userTorrents[0]).to.have.property('magnetLink');
        expect(this.userTorrents[0].magnetLink).to.match(/magnet:\?xt=.+/);
      });

      it('should have a category', () => {
        expect(this.userTorrents[0]).to.have.property('category');
        expect(this.userTorrents[0].category.id).to.match(/[1-6]00/);
        expect(this.userTorrents[0].category.name).to.match(/\w+/);
      });

      it('should have a subcategory', () => {
        expect(this.userTorrents[0]).to.have.property('subcategory');
        expect(this.userTorrents[0].subcategory.id).to.match(/[1-6][09][1-9]/);
        expect(this.userTorrents[0].subcategory.name).to.match(/[a-zA-Z0-9 ()/-]/);
      });
    });
  });

  /**
   * Get TV show
   */
  describe('Torrent.getTvShow(id)', function testGetTvShow() {
    beforeAll(async () => {
      this.tvShow = await Torrent.getTvShow('2');
    });

    it('should return a promise', () => {
      expect(Torrent.getTvShow('2')).to.be.a('promise');
    });
    describe('Helper Methods', () => {
      it('getProxyList should return an array of links', async () => {
        const list = await getProxyList();
        expect(list).to.be.an('array');
        for (const link of list) {
          expect(link).to.be.a('string');
          expect(link).to.contain('https://');
        }
      });
    });
  });
});
