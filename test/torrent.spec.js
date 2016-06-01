/**
 * Test all high level methods
 *
 * @todo: reduced the number of api calls by querying once and running multiple
 *        tests against that query. ideally, this would be done in a 'before'
 *        function
 */

/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import Parser from '../src/Parser';
import Torrent, { baseUrl } from '../src/Torrent';


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

function assertHasArrayOfTorrents(arrayOfTorrents) {
  expect(arrayOfTorrents).to.be.an('array');
  expect(arrayOfTorrents[0]).to.be.an('object');
}

/**
 * todo: test the 'torrentLink' property, which is undefined in many queries
 */
function assertHasNecessaryProperties(torrent) {
  const propertiesToValidate = [
    'id', 'name', 'size', 'link', 'category', 'seeders', 'leechers',
    'uploadDate', 'magnetLink', 'subcategory', 'uploader',
    'uploaderLink'
  ];

  for (const property of propertiesToValidate) {
    expect(torrent).to.have.property(property);
    expect(torrent[property]).to.exist;
  }
}

describe('Torrent', () => {
  describe('categories', function () {
    before(async () => {
      this.categories = await Torrent.getCategories();
    });

    it('retrieves categories', async (done) => {
      try {
        expect(this.categories).to.be.an('array');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('retrieves categories with expected properties', async (done) => {
      try {
        const properties = ['name', 'id', 'subcategories'];
        for (const property of properties) {
          expect(this.categories[0]).to.have.property(property);
          expect(this.categories[0][property]).to.exist;
        }
        done();
      } catch (err) {
        console.log(err);
      }
    });
  });

  describe('search', function () {
    before(async () => {
      this.search = await torrentSearchFactory();
    });

    it('searches for items', async (done) => {
      try {
        assertHasArrayOfTorrents(this.search);
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('retrieves expected properties', async (done) => {
      try {
        assertHasNecessaryProperties(this.search[0]);
        done();
      } catch (err) {
        console.log(err);
      }
    });

    // it('searches by page number', async (done) => {});
    // it('searches by orderBy', async (done) => {});
    // it('searches by category', async (done) => {});
  });

  describe('torrent types', () => {
    it('should get top torrents', async (done) => {
      try {
        const torrents = await Torrent.topTorrents();
        assertHasArrayOfTorrents(torrents);
        assertHasNecessaryProperties(torrents[0]);
        expect(torrents.length === 100).to.be.true;
        done();
      } catch (err) {
        console.log(err);
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
        console.log(err);
      }
    });

    it('should get users torrents', async (done) => {
      try {
        const torrents = await Torrent.userTorrents(testingUsername);
        assertHasArrayOfTorrents(torrents);
        assertHasNecessaryProperties(torrents[0]);
        done();
      } catch (err) {
        console.log(err);
      }
    });
  });

  describe('Torrent.getTorrent(id)', function () {
    before(async () => {
      this.torrent = await torrentFactory();
    });

    it('should have a name', (done) => {
      try {
        expect(this.torrent).to.have.property(
          'name',
          'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY'
        );
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have uploader', (done) => {
      try {
        expect(this.torrent).to.have.property('uploader', 'YIFY');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have uploader link', (done) => {
      try {
        expect(this.torrent).to.have.property('uploaderLink', `${baseUrl}/user/YIFY/`);
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it.skip('should have an info hash', (done) => {
      try {
        expect(this.torrent).to.have.property('uploader');
        expect(this.torrent.infoHash).to.equal('0259F6B98A7CA160A36F13457C89344C7DD34000');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have an id', (done) => {
      try {
        expect(this.torrent).to.have.property('id', '10676856');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have upload date', (done) => {
      try {
        expect(this.torrent).to.have.property('uploadDate', '2014-08-02 08:15:25 GMT');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have size', (done) => {
      try {
        expect(this.torrent).to.have.property('size');
        expect(this.torrent.size).to.match(/\d+\.\d+\s(G|M|K)iB/);
        done();
      } catch (err) {
        console.log(err);
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
        console.log(err);
      }
    });

    it('should have a link', (done) => {
      try {
        expect(this.torrent).to.have.property('link', `${baseUrl}/torrent/10676856`);
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('should have a magnet link', (done) => {
      expect(this.torrent).to.have.property('magnetLink');
      done();
    });

    it('should have a description', (done) => {
      expect(this.torrent).to.have.property('description');
      expect(this.torrent.description).to.be.a('string');
      done();
    });

    it('should have a picture', (done) => {
      expect(this.torrent).to.have.property('picture');
      expect(this.torrent.picture).to.be.a('string');
      done();
    });
  });
});

//
// Original tests
//

describe('Torrent.getCategories()', function () {
  before(async () => {
    try {
      this.cagtegories = await Torrent.getCategories();
      console.log(this.categories);
      this.subcategory = this.categories[0].subcategories[0];
    } catch (err) {
      console.log(err);
    }
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
