/**
 * Test all high level methods
 *
 * @TODO: Reduced the number of api calls by querying once and running multiple
 *        tests against that query. ideally, this would be done in a 'before'
 *        function
 */
import { expect as chaiExpect } from 'chai';
import { parseCategories, parsePage, getProxyList } from '../src/parser';
import Torrent, { baseUrl, convertOrderByObject } from '../src';

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

function torrentCommentsFactory() {
  return Torrent.getComments('10676856');
}

function torrentCategoryFactory() {
  return Torrent.getCategories();
}

function greaterThanOrEqualTo(first, second) {
  return first > second || first === second;
}

function lessThanOrEqualToZero(first, second) {
  return first < second || first === 0;
}

function assertHasArrayOfTorrents(arrayOfTorrents) {
  chaiExpect(arrayOfTorrents).to.be.an('array');
  chaiExpect(arrayOfTorrents[0]).to.be.an('object');
}

/**
 * todo: test the 'torrentLink' property, which is undefined in many queries
 */
function assertHasNecessaryProperties(torrent, additionalProperties = []) {
  const defaultPropertiesToValidate = [
    'id',
    'name',
    'size',
    'link',
    'category',
    'seeders',
    'leechers',
    'uploadDate',
    'magnetLink',
    'subcategory',
    'uploader',
    'verified',
    'uploaderLink',
    ...additionalProperties
  ];

  for (const property of defaultPropertiesToValidate) {
    chaiExpect(torrent).to.have.property(property);
    chaiExpect(torrent[property]).to.exist;
    if (typeof torrent[property] === 'string') {
      chaiExpect(torrent[property]).to.not.contain('undefined');
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
      chaiExpect(searchNumber).to.equal(2);
    });

    it('should convert orderBy and sortBy with leechers', () => {
      const searchNumber = convertOrderByObject({
        orderBy: 'leeches',
        sortBy: 'desc'
      });
      chaiExpect(searchNumber).to.equal(9);
    });
  });

  describe('categories', function() {
    beforeAll(async () => {
      this.categories = await torrentCategoryFactory();
    });

    it('retrieves categories', async () => {
      chaiExpect(this.categories).to.be.an('array');
    });

    it('retrieves categories with expected properties', async () => {
      const properties = ['name', 'id', 'subcategories'];
      for (const property of properties) {
        chaiExpect(this.categories[0]).to.have.property(property);
        chaiExpect(this.categories[0][property]).to.exist;
        chaiExpect(this.categories[0][property]).to.not.contain('undefined');
      }
    });
  });

  describe('comments', function() {
    beforeAll(async () => {
      this.comments = await torrentCommentsFactory();
    });

    it('retrieves comments', async () => {
      chaiExpect(this.comments).to.be.an('array');
    });

    it('retrieves comments with expected properties', async () => {
      const properties = ['user', 'comment'];
      for (const property of properties) {
        chaiExpect(this.comments[0])
          .to.have.property(property)
          .that.is.a('string');
      }
    });
  });

  /**
   * @todo
   *
   * it('searches by page number', async () => {});
   * it('searches by category', async () => {});
   */
  describe('search', function() {
    beforeAll(async () => {
      this.search = await torrentSearchFactory();
    });

    it('searches for items', async () => {
      assertHasArrayOfTorrents(this.search);
    });

    it('should have verified property', () => {
      chaiExpect(this.search[0]).to.have.property('verified');
      chaiExpect(this.search[0].verified).to.be.a('boolean');
    });

    it('should search un-verified', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        filter: {
          verified: false
        }
      });

      for (const result of searchResults) {
        chaiExpect(result)
          .to.have.property('verified')
          .that.is.a('boolean');
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

      chaiExpect(searchResults[0][0].category.name).to.equal('Applications');
      chaiExpect(searchResults[1][0].category.name).to.equal('Audio');
      chaiExpect(searchResults[2][0].category.name).to.equal('Video');
      chaiExpect(searchResults[3][0].category.name).to.equal('Games');
      chaiExpect(searchResults[4][0].category.name).to.equal('Porn');
      chaiExpect(searchResults[5][0].category.name).to.equal('Other');
    });

    it('should handle numerical values', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        page: 1,
        orderBy: 'seeds',
        sortBy: 'asc'
      });
      assertHasNecessaryProperties(searchResults[0]);
    });

    it('should handle non-numerical values', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: 'all',
        page: '1',
        orderBy: 'seeds',
        sortBy: 'asc'
      });
      assertHasNecessaryProperties(searchResults[0]);
    });

    it('should search with backwards compatible method', async () => {
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

    it('searches by sortBy: desc', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        orderBy: 'seeds',
        sortBy: 'desc'
      });

      greaterThanOrEqualTo(searchResults[0].seeders, searchResults[1].seeders);
      greaterThanOrEqualTo(searchResults[1].seeders, searchResults[2].seeders);
      greaterThanOrEqualTo(searchResults[3].seeders, searchResults[3].seeders);
    });

    it('searches by sortBy: asc', async () => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        orderBy: 'seeds',
        sortBy: 'asc'
      });

      lessThanOrEqualToZero(searchResults[0].seeders, searchResults[1].seeders);
      lessThanOrEqualToZero(searchResults[1].seeders, searchResults[2].seeders);
      lessThanOrEqualToZero(searchResults[3].seeders, searchResults[3].seeders);
    });

    it('should get torrents, strict', async () => {
      const searchResults = await Promise.all([
        Torrent.search('Game of Thrones S01E08'),
        Torrent.search('Game of Thrones S02E03'),
        Torrent.search('Game of Thrones S03E03')
      ]);

      for (const result of searchResults) {
        chaiExpect(result).to.have.length.above(10);
        chaiExpect(result[0])
          .to.have.deep.property('seeders')
          .that.is.greaterThan(20);
      }
    });
  });

  /**
   * Get torrent types
   */
  describe('torrent types', () => {
    it('should get top torrents', async () => {
      const torrents = await Torrent.topTorrents();
      assertHasArrayOfTorrents(torrents);
      assertHasNecessaryProperties(torrents[0]);
      chaiExpect(torrents.length === 100).to.be.true;
    });

    it('should get recent torrents', async () => {
      const torrents = await Torrent.recentTorrents();
      assertHasArrayOfTorrents(torrents);
      assertHasNecessaryProperties(torrents[0]);
      chaiExpect(torrents).to.have.length.above(20);
    });

    it('should get users torrents', async () => {
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
  describe('Torrent.getTorrent(id)', function() {
    beforeAll(async () => {
      this.torrent = await torrentFactory();
    });

    it('should have no undefined properties', () => {
        for (const property in this.torrent) { // eslint-disable-line
        if (this.torrent.hasOwnProperty(property)) {
          if (typeof this.torrent[property] === 'string') {
            chaiExpect(this.torrent[property]).to.not.include('undefined');
          }
        }
      }
    });

    it('should return a promise', () => {
      chaiExpect(torrentFactory()).to.be.a('promise');
    });

    it('should have a name', () => {
      chaiExpect(this.torrent).to.have.property(
        'name',
        'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY'
      );
    });

    it('should have uploader', () => {
      chaiExpect(this.torrent).to.have.property('uploader', 'YIFY');
    });

    it('should have uploader link', () => {
      chaiExpect(this.torrent).to.have.property(
        'uploaderLink',
        `${baseUrl}/user/YIFY/`
      );
    });

    it('should have an id', () => {
      chaiExpect(this.torrent).to.have.property('id', '10676856');
    });

    it('should have upload date', () => {
      chaiExpect(this.torrent).to.have.property(
        'uploadDate',
        '2014-08-02 08:15:25 GMT'
      );
    });

    it('should have size', () => {
      chaiExpect(this.torrent).to.have.property('size');
      chaiExpect(this.torrent.size).to.match(/\d+\.\d+\s(G|M|K)iB/);
    });

    it('should have seeders and leechers count', () => {
      chaiExpect(this.torrent).to.have.property('seeders');
      chaiExpect(this.torrent).to.have.property('leechers');
      chaiExpect(~~this.torrent.leechers).to.be.above(-1);
      chaiExpect(~~this.torrent.seeders).to.be.above(-1);
    });

    it('should have a link', () => {
      chaiExpect(this.torrent).to.have.property(
        'link',
        `${baseUrl}/torrent/10676856`
      );
    });

    it('should have a magnet link', () => {
      chaiExpect(this.torrent).to.have.property('magnetLink');
    });

    it('should have a description', () => {
      chaiExpect(this.torrent).to.have.property('description');
      chaiExpect(this.torrent.description).to.be.a('string');
    });
  });

  /**
   * Search
   */
  describe('Torrent.search(title, opts)', function() {
    beforeAll(async () => {
      this.searchResults = await Torrent.search('Game of Thrones');
      this.fistSearchResult = this.searchResults[0];
    });

    it('should return a promise', () => {
      chaiExpect(Torrent.search('Game of Thrones')).to.be.a('promise');
    });

    it('should return an array of search results', () => {
      chaiExpect(this.searchResults).to.be.an('array');
    });

    describe('search result', () => {
      it('should have an id', () => {
        chaiExpect(this.fistSearchResult).to.have.property('id');
        chaiExpect(this.fistSearchResult.id).to.match(/^\d+$/);
      });

      it('should have a name', () => {
        chaiExpect(this.fistSearchResult).to.have.property('name');
        chaiExpect(this.fistSearchResult.name).to.match(/game.of.thrones/i);
      });

      it('should have upload date', () => {
        chaiExpect(this.fistSearchResult).to.have.property('uploadDate');
        /**
         * Valid dates:
         *  31 mins ago
         *  Today 02:18
         *  Y-day 22:14
         *  02-10 03:36
         *  06-21 2011
         */
        chaiExpect(this.fistSearchResult.uploadDate).to.match(
          /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
        );
      });

      it('should have size', () => {
        chaiExpect(this.fistSearchResult).to.have.property('size');
        /**
         * Valid sizes:
         *  529.84 MiB
         *  2.04 GiB
         *  598.98 KiB
         */
        chaiExpect(this.fistSearchResult.size).to.exist;
      });

      it('should have seeders and leechers count', () => {
        chaiExpect(this.fistSearchResult).to.have.property('seeders');
        chaiExpect(this.fistSearchResult).to.have.property('leechers');
        chaiExpect(~~this.fistSearchResult.leechers).to.be.above(-1);
        chaiExpect(~~this.fistSearchResult.seeders).to.be.above(-1);
      });

      it('should have a link', () => {
        chaiExpect(this.fistSearchResult).to.have.property('link');
        chaiExpect(this.fistSearchResult.link).to.match(
          new RegExp(`${baseUrl}/torrent/\\d+/+`)
        );
      });

      it('should have a magnet link', () => {
        chaiExpect(this.fistSearchResult).to.have.property('magnetLink');
        chaiExpect(this.fistSearchResult.magnetLink).to.match(/magnet:\?xt=.+/);
      });

      it('should have a category', () => {
        chaiExpect(this.fistSearchResult).to.have.property('category');
        chaiExpect(this.fistSearchResult.category.id).to.match(/[1-6]00/);
        chaiExpect(this.fistSearchResult.category.name).to.match(/\w+/);
      });

      it('should have a subcategory', () => {
        chaiExpect(this.fistSearchResult).to.have.property('subcategory');
        chaiExpect(this.fistSearchResult.subcategory.id).to.match(
          /[1-6][09][1-9]/
        );
        chaiExpect(this.fistSearchResult.subcategory.name).to.match(
          /[a-zA-Z0-9 ()/-]/
        );
      });

      it('should have an uploader and uploader link', () => {
        chaiExpect(this.fistSearchResult).to.have.property('uploader');
        chaiExpect(this.fistSearchResult).to.have.property('uploaderLink');
      });
    });
  });

  describe('Torrent.topTorrents(category, opts)', function() {
    beforeAll(async () => {
      this.topTorrents = await Torrent.topTorrents('205');
    });

    it('should return a promise', () => {
      chaiExpect(Torrent.topTorrents('205')).to.be.a('promise');
    });

    it('should handle numeric input', async () => {
      const topTorrents = await Torrent.topTorrents(205);
      chaiExpect(topTorrents).to.be.an('array');
      chaiExpect(topTorrents[0].category.name).to.be.equal('Video');
      chaiExpect(topTorrents[0].subcategory.name).to.be.equal('TV shows');
    });

    it('should return an array of top torrents of the selected category', () => {
      chaiExpect(this.topTorrents).to.be.an('array');
    });

    describe('search result', () => {
      it('category and subcategory shoud match specified category', () => {
        chaiExpect(this.topTorrents[0].category.name).to.be.equal('Video');
        chaiExpect(this.topTorrents[0].subcategory.name).to.be.equal(
          'TV shows'
        );
      });
    });
  });

  describe('Torrent.recentTorrents()', function testRecentTorrents() {
    beforeAll(async () => {
      this.recentTorrents = await Torrent.recentTorrents();
    });

    it('should return a promise', () => {
      chaiExpect(Torrent.recentTorrents()).to.be.a('promise');
    });

    it('should return an array of the most recent torrents', () => {
      chaiExpect(this.recentTorrents).to.be.an('array');
    });

    describe('recent torrent', () => {
      it('should be uploaded recently', () => {
        const [recentTorrent] = this.recentTorrents;
        chaiExpect(recentTorrent.uploadDate).to.exist;
      });
    });
  });

  describe('Torrent.getCategories()', function testGetCategories() {
    beforeAll(async () => {
      this.categories = await torrentCategoryFactory();
      this.subcategory = this.categories[0].subcategories[0];
    });

    it('should return promise', () => {
      chaiExpect(parsePage(`${baseUrl}/recent`, parseCategories)).to.be.a(
        'promise'
      );
    });

    it('should return an array of categories', () => {
      chaiExpect(this.categories).to.be.an('array');
    });

    describe('category', () => {
      it('should have an id', () => {
        chaiExpect(this.categories[0]).to.have.property('id');
        chaiExpect(this.categories[0].id).to.match(/\d00/);
      });

      it('should have a name', () => {
        chaiExpect(this.categories[0]).to.have.property('name');
        chaiExpect(this.categories[0].name).to.be.a('string');
      });

      it('name should match id', () => {
        const video = this.categories.find(elem => elem.name === 'Video');
        chaiExpect(video.id).to.equal('200');
      });

      it('shold have subcategories array', () => {
        chaiExpect(this.categories[0]).to.have.property('subcategories');
        chaiExpect(this.categories[0].subcategories).to.be.an('array');
      });

      describe('subcategory', () => {
        it('should have an id', () => {
          chaiExpect(this.subcategory).to.have.property('id');
          chaiExpect(this.subcategory.id).to.match(/\d{3}/);
        });

        it('should have a name', () => {
          chaiExpect(this.subcategory).to.have.property('name');
          chaiExpect(this.subcategory.name).to.be.a('string');
        });
      });
    });
  });

  describe('Torrent.getComments()', function testGetComments() {
    beforeAll(async () => {
      this.comments = await torrentCommentsFactory();
    });

    it('should return promise', () => {
      chaiExpect(Torrent.getComments('10676856')).to.be.a('promise');
    });

    it('should return an array of comment', () => {
      chaiExpect(this.comments).to.be.an('array');
    });

    describe('comment', () => {
      it('should have a user', () => {
        chaiExpect(this.comments[0]).to.have.property('user');
        chaiExpect(this.comments[0].user).to.be.a('string');
      });

      it('should have a comment', () => {
        chaiExpect(this.comments[0]).to.have.property('comment');
        chaiExpect(this.comments[0].comment).to.be.a('string');
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
      chaiExpect(Torrent.userTorrents('YIFY')).to.be.a('promise');
    });

    it('should return an array of the user torrents', () => {
      chaiExpect(this.userTorrents).to.be.an('array');
    });

    describe('user torrent', () => {
      it('should have a name', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('name');
      });

      it('should have upload date', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('uploadDate');
        /*
         * Valid dates:
         *  31 mins ago
         *  Today 02:18
         *  Y-day 22:14
         *  02-10 03:36
         *  06-21 2011
         */
        chaiExpect(this.userTorrents[0].uploadDate).to.match(
          /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
        );
      });

      it('should have size', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('size');
        /*
         * Valid sizes:
         *  529.84 MiB
         *  2.04 GiB
         *  598.98 KiB
         */
        chaiExpect(this.userTorrents[0].size).to.match(/\d+\.\d+\s(G|M|K)iB/);
      });

      it('should have seeders and leechers count', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('seeders');
        chaiExpect(this.userTorrents[0]).to.have.property('leechers');
        chaiExpect(~~this.userTorrents[0].leechers).to.be.above(-1);
        chaiExpect(~~this.userTorrents[0].seeders).to.be.above(-1);
      });

      it('should have a link', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('link');
        chaiExpect(this.userTorrents[0].link).to.match(
          new RegExp(`${baseUrl}/torrent/\\d+/+`)
        );
      });

      it('should have a magnet link', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('magnetLink');
        chaiExpect(this.userTorrents[0].magnetLink).to.match(/magnet:\?xt=.+/);
      });

      it('should have a category', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('category');
        chaiExpect(this.userTorrents[0].category.id).to.match(/[1-6]00/);
        chaiExpect(this.userTorrents[0].category.name).to.match(/\w+/);
      });

      it('should have a subcategory', () => {
        chaiExpect(this.userTorrents[0]).to.have.property('subcategory');
        chaiExpect(this.userTorrents[0].subcategory.id).to.match(
          /[1-6][09][1-9]/
        );
        chaiExpect(this.userTorrents[0].subcategory.name).to.match(
          /[a-zA-Z0-9 ()/-]/
        );
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
      chaiExpect(Torrent.getTvShow('2')).to.be.a('promise');
    });
    describe('Helper Methods', () => {
      it('getProxyList should return an array of links', async () => {
        const list = await getProxyList();
        chaiExpect(list).to.be.an('array');
        for (const link of list) {
          chaiExpect(link).to.be.a('string');
          chaiExpect(link).to.contain('https://');
        }
      });
    });
  });
});
