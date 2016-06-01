/**
 * Test all high level methods
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

const torrent = torrentFactory();

describe('Torrent', () => {
  describe('categories', () => {
    it('retrieves categories', async (done) => {
      try {
        const categories = await Torrent.getCategories();
        expect(categories).to.be.an('array');
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('retrieves categories with expected properties', async (done) => {
      try {
        const categories = await Torrent.getCategories();
        const properties = ['name', 'id', 'subcategories'];
        for (const property of properties) {
          expect(categories[0]).to.have.property(property);
          expect(categories[0][property]).to.exist;
        }
        done();
      } catch (err) {
        console.log(err);
      }
    });
  });

  describe('search', () => {
    it('searches for items', async (done) => {
      try {
        const search = await torrentSearchFactory();
        assertHasArrayOfTorrents(search);
        done();
      } catch (err) {
        console.log(err);
      }
    });

    it('retrieves expected properties', async (done) => {
      try {
        const search = await torrentSearchFactory();
        assertHasNecessaryProperties(search[0]);
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

  // describe('Torrent.getTorrent(id)', () => {
  //   it('shold have a name', (done) => {
  //     torrent.should.have.property('name');
  //     torrent.name.should.equal('The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY');
  //     done();
  //   });
  //
  //   it('should have uploader', (done) => {
  //     torrent.should.have.property('uploader');
  //     torrent.uploader.should.equal('YIFY');
  //     done();
  //   });
  //
  //   it('should have uploader link', (done) => {
  //     torrent.should.have.property('uploaderLink');
  //     torrent.uploaderLink.should.equal(`${baseUrl}/user/YIFY/`);
  //     done();
  //   });
  //
  //   it.skip('should have an info hash', (done) => {
  //     torrent.should.have.property('uploader');
  //     torrent.infoHash.should.equal('0259F6B98A7CA160A36F13457C89344C7DD34000');
  //     done();
  //   });
  //
  //   it('should have an id', (done) => {
  //     torrent.should.have.property('id');
  //     torrent.id.should.equal('10676856');
  //     done();
  //   });
  //
  //   it('should have upload date', (done) => {
  //     torrent.should.have.property('uploadDate');
  //     torrent.uploadDate.should.equal('2014-08-02 08:15:25 GMT');
  //     done();
  //   });
  //
  //   it('should have size', (done) => {
  //     torrent.should.have.property('size');
  //     torrent.size.should.match(/\d+\.\d+\s(G|M|K)iB/);
  //     done();
  //   });
  //
  //   it('should have seeders and leechers count', (done) => {
  //     torrent.should.have.property('seeders');
  //     torrent.should.have.property('leechers');
  //     (~~torrent.leechers).should.be.within(5, 100000);
  //     (~~torrent.seeders).should.be.within(5, 100000);
  //     done();
  //   });
  //
  //   it('should have a link', (done) => {
  //     torrent.should.have.property('link');
  //     torrent.link.should.equal(`${baseUrl}/torrent/10676856`);
  //     done();
  //   });
  //
  //   it('should have a magnet link', (done) => {
  //     torrent.should.have.property('magnetLink');
  //     // torrent.magnetLink.should.match('/magnet:\?xt=urn:btih:/');done()
  //   });
  //
  //   it('should have a description', (done) => {
  //     torrent.should.have.property('description');
  //     torrent.description.should.be.a.String;
  //     done();
  //   });
  //
  //   it('should have a picture', (done) => {
  //     torrent.should.have.property('picture');
  //     torrent.picture.should.be.a.String;
  //     done();
  //   });
  // });
});
