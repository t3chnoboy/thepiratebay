/**
 * Test all high level methods
 *
 * @todo: reduced the number of api calls by querying once and running multiple
 *        tests against that query. ideally, this would be done in a 'before'
 *        function
 */

/* eslint no-unused-expressions: 0, no-console: 0, func-names: 0 */
import { expect } from 'chai';
import { parseCategories, parsePage } from '../src/Parser';
import Torrent, { baseUrl, convertOrderByObject } from '../src/Torrent';


const testingUsername = 'YIFY';

async function torrentFactory() {
  const torrent = await Torrent.getTorrent(10676856);
  return torrent;
}

async function torrentSearchFactory() {
  return Torrent.search('Game of Thrones', {
    category: '205'
  });
}

async function torrentCategoryFactory() {
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
    it('should convert orderBy and sortBy', (done) => {
      try {
        const searchNumber = convertOrderByObject({
          orderBy: 'name', sortBy: 'asc'
        });
        expect(searchNumber).to.equal(2);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should convert orderBy and sortBy', (done) => {
      try {
        const searchNumber = convertOrderByObject({
          orderBy: 'leeches', sortBy: 'desc'
        });
        expect(searchNumber).to.equal(9);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  describe('categories', function () {
    before(async () => {
      try {
        this.categories = await torrentCategoryFactory();
      } catch (err) {
        console.log(err);
      }
    });

    it('retrieves categories', async (done) => {
      try {
        expect(this.categories).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('retrieves categories with expected properties', async (done) => {
      try {
        const properties = ['name', 'id', 'subcategories'];
        for (const property of properties) {
          expect(this.categories[0]).to.have.property(property);
          expect(this.categories[0][property]).to.exist;
          expect(this.categories[0][property]).to.not.contain('undefined');
        }
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  /**
   * @todo
   *
   * it('searches by page number', async (done) => {});
   * it('searches by category', async (done) => {});
   */
  describe('search', function () {
    before(async () => {
      try {
        this.search = await torrentSearchFactory();
      } catch (err) {
        console.log(err);
      }
    });

    it('searches for items', async (done) => {
      try {
        assertHasArrayOfTorrents(this.search);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have verified property', (done) => {
      try {
        expect(this.search[0]).to.have.property('verified');
        expect(this.search[0].verified).to.be.a('boolean');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should filter verified by default', (done) => {
      try {
        for (const result of this.search) {
          expect(result).to.have.property('verified');
          expect(result.verified).to.equal(true);
        }
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should search un-verified', async (done) => {
      const searchResults = await Torrent.search('Game of Thrones', {
        category: '205',
        filter: {
          verified: false
        }
      });

      try {
        for (const result of searchResults) {
          expect(result).to.have.property('verified').that.is.a('boolean');
        }
        done();
      } catch (err) {
        done(err);
      }
    });

    /**
     * Assert by searching wrong
     */
    it('should search using primary category names', async function getCategoryNames(done) {
      this.timeout(50000);

      try {
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
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should handle numerical values', async (done) => {
      try {
        const searchResults = await Torrent.search('Game of Thrones', {
          page: 1,
          orderBy: 'seeds',
          sortBy: 'asc'
        });
        assertHasNecessaryProperties(searchResults[0]);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should handle non-numerical values', async (done) => {
      try {
        const searchResults = await Torrent.search('Game of Thrones', {
          category: 'all',
          page: '1',
          orderBy: 'seeds',
          sortBy: 'asc'
        });
        assertHasNecessaryProperties(searchResults[0]);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should search with backwards compatible method', async (done) => {
      try {
        const searchResults = await Torrent.search('Game of Thrones', {
          orderby: '8' // Search orderby seeds, asc
        });
        assertHasNecessaryProperties(searchResults[0]);
        lessThanOrEqualToZero(searchResults[0].seeders, searchResults[1].seeders);
        lessThanOrEqualToZero(searchResults[1].seeders, searchResults[2].seeders);
        lessThanOrEqualToZero(searchResults[3].seeders, searchResults[3].seeders);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('retrieves expected properties', async (done) => {
      try {
        assertHasNecessaryProperties(this.search[0]);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('searches by sortBy: desc', async (done) => {
      try {
        const searchResults = await Torrent.search('Game of Thrones', {
          category: '205',
          orderBy: 'seeds',
          sortBy: 'desc'
        });

        greaterThanOrEqualTo(searchResults[0].seeders, searchResults[1].seeders);
        greaterThanOrEqualTo(searchResults[1].seeders, searchResults[2].seeders);
        greaterThanOrEqualTo(searchResults[3].seeders, searchResults[3].seeders);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('searches by sortBy: asc', async (done) => {
      try {
        const searchResults = await Torrent.search('Game of Thrones', {
          category: '205',
          orderBy: 'seeds',
          sortBy: 'asc'
        });

        lessThanOrEqualToZero(searchResults[0].seeders, searchResults[1].seeders);
        lessThanOrEqualToZero(searchResults[1].seeders, searchResults[2].seeders);
        lessThanOrEqualToZero(searchResults[3].seeders, searchResults[3].seeders);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  /**
   * Get torrent types
   */
  describe('torrent types', () => {
    it('should get top torrents', async (done) => {
      try {
        const torrents = await Torrent.topTorrents();
        assertHasArrayOfTorrents(torrents);
        assertHasNecessaryProperties(torrents[0]);
        expect(torrents.length === 100).to.be.true;
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should get recent torrents', async (done) => {
      try {
        const torrents = await Torrent.recentTorrents();
        assertHasArrayOfTorrents(torrents);
        assertHasNecessaryProperties(torrents[0]);
        expect(torrents).to.have.lengthOf(30);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should get users torrents', async (done) => {
      try {
        const torrents = await Torrent.userTorrents(testingUsername);
        assertHasArrayOfTorrents(torrents);
        assertHasNecessaryProperties(torrents[0]);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  //
  // Original tests
  //

  /**
   * Get torrents
   */
  describe('Torrent.getTorrent(id)', function () {
    before(async () => {
      try {
        this.torrent = await torrentFactory();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have no undefined properties', (done) => {
      try {
        for (const property in this.torrent) { // eslint-disable-line
          if (this.torrent.hasOwnProperty(property)) {
            if (typeof this.torrent[property] === 'string') {
              expect(this.torrent[property]).to.not.include('undefined');
            }
          }
        }
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(torrentFactory()).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have a name', (done) => {
      try {
        expect(this.torrent).to.have.property(
          'name',
          'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY'
        );
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have uploader', (done) => {
      try {
        expect(this.torrent).to.have.property('uploader', 'YIFY');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have uploader link', (done) => {
      try {
        expect(this.torrent).to.have.property('uploaderLink', `${baseUrl}/user/YIFY/`);
        done();
      } catch (err) {
        done(err);
      }
    });

    it.skip('should have an info hash', (done) => {
      try {
        expect(this.torrent).to.have.property('uploader');
        expect(this.torrent.infoHash).to.equal('0259F6B98A7CA160A36F13457C89344C7DD34000');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have an id', (done) => {
      try {
        expect(this.torrent).to.have.property('id', '10676856');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have upload date', (done) => {
      try {
        expect(this.torrent).to.have.property('uploadDate', '2014-08-02 08:15:25 GMT');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have size', (done) => {
      try {
        expect(this.torrent).to.have.property('size');
        expect(this.torrent.size).to.match(/\d+\.\d+\s(G|M|K)iB/);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have seeders and leechers count', (done) => {
      try {
        expect(this.torrent).to.have.property('seeders');
        expect(this.torrent).to.have.property('leechers');
        expect(~~this.torrent.leechers).to.be.within(5, 100000);
        expect(~~this.torrent.seeders).to.be.within(5, 100000);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have a link', (done) => {
      try {
        expect(this.torrent).to.have.property('link', `${baseUrl}/torrent/10676856`);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have a magnet link', (done) => {
      try {
        expect(this.torrent).to.have.property('magnetLink');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should have a description', (done) => {
      try {
        expect(this.torrent).to.have.property('description');
        expect(this.torrent.description).to.be.a('string');
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  /**
   * Search
   */
  describe('Torrent.search(title, opts)', function () {
    before(async () => {
      try {
        this.searchResults = await Torrent.search('Game of Thrones');
        this.fistSearchResult = this.searchResults[0];
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.search('Game of Thrones')).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return an array of search results', (done) => {
      try {
        expect(this.searchResults).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('search result', () => {
      it('should have an id', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('id');
          expect(this.fistSearchResult.id).to.match(/^\d+$/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a name', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('name');
          expect(this.fistSearchResult.name).to.match(/game.of.thrones/i);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have upload date', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('uploadDate');
          /*
                  # Valid dates:
                  #  31 mins ago
                  #  Today 02:18
                  #  Y-day 22:14
                  #  02-10 03:36
                  #  06-21 2011
                  */
          expect(this.fistSearchResult.uploadDate)
            .to
            .match(
              /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
            );

          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have size', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('size');
          /*
                  # Valid sizes:
                  #  529.84 MiB
                  #  2.04 GiB
                  #  598.98 KiB
                  */
          expect(this.fistSearchResult.size).to.exist;
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have seeders and leechers count', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('seeders');
          expect(this.fistSearchResult).to.have.property('leechers');
          expect((~~this.fistSearchResult.leechers)).to.be.within(0, 100000);
          expect((~~this.fistSearchResult.seeders)).to.be.within(0, 100000);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a link', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('link');
          expect(this.fistSearchResult.link).to.match(
            new RegExp(`${baseUrl}/torrent/\\d+/\.+`)
          );
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a magnet link', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('magnetLink');
          expect(this.fistSearchResult.magnetLink).to.match(/magnet:\?xt=.+/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a category', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('category');
          expect(this.fistSearchResult.category.id).to.match(/[1-6]00/);
          expect(this.fistSearchResult.category.name).to.match(/\w+/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a subcategory', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('subcategory');
          expect(this.fistSearchResult.subcategory.id).to.match(/[1-6][09][1-9]/);
          expect(this.fistSearchResult.subcategory.name).to.match(/[a-zA-Z0-9 ()/-]/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have an uploader and uploader link', (done) => {
        try {
          expect(this.fistSearchResult).to.have.property('uploader');
          expect(this.fistSearchResult).to.have.property('uploaderLink');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('Torrent.topTorrents(category, opts)', function () {
    before(async () => {
      try {
        this.topTorrents = await Torrent.topTorrents('205');
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.topTorrents('205')).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should handle numeric input', async (done) => {
      try {
        const topTorrents = await Torrent.topTorrents(205);
        expect(topTorrents).to.be.an('array');
        expect(topTorrents[0].category.name).to.be.equal('Video');
        expect(topTorrents[0].subcategory.name).to.be.equal('TV shows');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return an array of top torrents of the selected category', (done) => {
      try {
        expect(this.topTorrents).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('search result', () => {
      it('category and subcategory shoud match specified category', (done) => {
        try {
          expect(this.topTorrents[0].category.name).to.be.equal('Video');
          expect(this.topTorrents[0].subcategory.name).to.be.equal('TV shows');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('Torrent.recentTorrents()', function testRecentTorrents() {
    before(async () => {
      try {
        this.recentTorrents = await Torrent.recentTorrents();
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.recentTorrents()).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return an array of the most recent torrents', (done) => {
      try {
        expect(this.recentTorrents).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('recent torrent', () => {
      it('should be uploaded recently', (done) => {
        try {
          const [recentTorrent] = this.recentTorrents;
          expect(recentTorrent.uploadDate).to.exist;
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('Torrent.getCategories()', function testGetCategories() {
    before(async () => {
      try {
        this.categories = await torrentCategoryFactory();
        this.subcategory = this.categories[0].subcategories[0];
      } catch (err) {
        console.log(err);
      }
    });

    it('should return promise', (done) => {
      try {
        expect(parsePage(`${baseUrl}/recent`, parseCategories)).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return an array of categories', (done) => {
      try {
        expect(this.categories).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('category', () => {
      it('should have an id', (done) => {
        try {
          expect(this.categories[0]).to.have.property('id');
          expect(this.categories[0].id).to.match(/\d00/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a name', (done) => {
        try {
          expect(this.categories[0]).to.have.property('name');
          expect(this.categories[0].name).to.be.a('string');
          done();
        } catch (err) {
          done(err);
        }
      });

      it('name should match id', (done) => {
        try {
          const video = this.categories.find((elem) => elem.name === 'Video');
          expect(video.id).to.equal('200');
          done();
        } catch (err) {
          done(err);
        }
      });

      it('shold have subcategories array', (done) => {
        try {
          expect(this.categories[0]).to.have.property('subcategories');
          expect(this.categories[0].subcategories).to.be.an('array');
          done();
        } catch (err) {
          done(err);
        }
      });

      describe('subcategory', () => {
        it('should have an id', (done) => {
          try {
            expect(this.subcategory).to.have.property('id');
            expect(this.subcategory.id).to.match(/\d{3}/);
            done();
          } catch (err) {
            done(err);
          }
        });

        it('should have a name', (done) => {
          try {
            expect(this.subcategory).to.have.property('name');
            expect(this.subcategory.name).to.be.a('string');
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });

  /**
   * User torrents
   */
  describe('Torrent.userTorrents(userName, opts)', function testUserTorrents() {
    before(async () => {
      try {
        this.userTorrents = await Torrent.userTorrents('YIFY');
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.userTorrents('YIFY')).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it('should return an array of the user torrents', (done) => {
      try {
        expect(this.userTorrents).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('user torrent', () => {
      it('should have a name', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('name');
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have upload date', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('uploadDate');
          /*
                  # Valid dates:
                  #  31 mins ago
                  #  Today 02:18
                  #  Y-day 22:14
                  #  02-10 03:36
                  #  06-21 2011
                  */
          expect(this.userTorrents[0].uploadDate)
            .to
            .match(
              /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/
            );
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have size', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('size');
          /*
                  # Valid sizes:
                  #  529.84 MiB
                  #  2.04 GiB
                  #  598.98 KiB
                  */
          expect(this.userTorrents[0].size).to.match(/\d+\.\d+\s(G|M|K)iB/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have seeders and leechers count', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('seeders');
          expect(this.userTorrents[0]).to.have.property('leechers');
          expect((~~this.userTorrents[0].leechers)).to.be.within(0, 100000);
          expect((~~this.userTorrents[0].seeders)).to.be.within(0, 100000);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a link', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('link');
          expect(this.userTorrents[0].link).to.match(new RegExp(`${baseUrl}/torrent/\\d+/\.+`));
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a magnet link', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('magnetLink');
          expect(this.userTorrents[0].magnetLink).to.match(/magnet:\?xt=.+/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a category', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('category');
          expect(this.userTorrents[0].category.id).to.match(/[1-6]00/);
          expect(this.userTorrents[0].category.name).to.match(/\w+/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it('should have a subcategory', (done) => {
        try {
          expect(this.userTorrents[0]).to.have.property('subcategory');
          expect(this.userTorrents[0].subcategory.id).to.match(/[1-6][09][1-9]/);
          expect(this.userTorrents[0].subcategory.name).to.match(/[a-zA-Z0-9 ()/-]/);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  /**
   * TV shows
   */
  describe('Torrent.tvShows()', function testTvShows() {
    before(async () => {
      try {
        this.tvShows = await Torrent.tvShows();
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.tvShows()).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it.skip('should yield an array', (done) => {
      try {
        expect(this.tvShows).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('tv show', () => {
      it.skip('should have a title', (done) => {
        try {
          expect(this.tvShows[0].title).to.be.a('string');
          done();
        } catch (err) {
          done(err);
        }
      });

      it.skip('should have an id', (done) => {
        try {
          expect(this.tvShows[0].id).to.match(/^\d+$/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it.skip('should have sesons list', (done) => {
        try {
          expect(this.tvShows[0].seasons).to.be.an('array');
          expect(this.tvShows[0].seasons.length).to.be.greaterThan(0);
          done();
        } catch (err) {
          done(err);
        }
      });

      it.skip('season number should be valid', (done) => {
        try {
          expect(this.tvShows[0].seasons[0]).to.match(/^S\d+$/);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  /**
   * Get TV show
   */
  describe('Torrent.getTvShow(id)', function testGetTvShow() {
    before(async () => {
      try {
        this.tvShow = await Torrent.getTvShow('2');
      } catch (err) {
        console.log(err);
      }
    });

    it('should return a promise', (done) => {
      try {
        expect(Torrent.getTvShow('2')).to.be.a('promise');
        done();
      } catch (err) {
        done(err);
      }
    });

    it.skip('should return an array of seasons', (done) => {
      try {
        expect(this.tvShow).to.be.an('array');
        done();
      } catch (err) {
        done(err);
      }
    });

    describe('season', () => {
      it.skip('should have a title', (done) => {
        try {
          expect(this.tvShow[0].title).to.be.a('string');
          expect(this.tvShow[0].title).to.match(/^S\d+$/);
          done();
        } catch (err) {
          done(err);
        }
      });

      it.skip('should have an array of torrents', (done) => {
        try {
          expect(this.tvShow[0].torrents).to.be.an('array');
          done();
        } catch (err) {
          done(err);
        }
      });

      describe('link', () => {
        it.skip('should have a title', (done) => {
          try {
            expect(this.tvShow[0].torrents[0].title).to.be.a('string');
            done();
          } catch (err) {
            done(err);
          }
        });

        it.skip('should have a link', (done) => {
          try {
            expect(this.tvShow[0].torrents[0].link).to.be.a('string');
            done();
          } catch (err) {
            done(err);
          }
        });

        it.skip('should have an id', (done) => {
          try {
            expect(this.tvShow[0].torrents[0].id).to.match(/^\d+$/);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});
