/**
 * Test all high level methods
 */

/* eslint no-unused-expressions: 0 */
import { expect } from 'chai';
import Parser from '../src/Parser';
import Torrent, { baseUrl } from '../src/Torrent';


describe('Torrent', () => {
  describe('Torrent.getTorrent(id)', async () => {
    const torrent = await Torrent.getTorrent(10676856);

    it('shold have a name', (done) => {
      torrent.should.have.property('name');
      torrent.name.should.equal('The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY');
      done();
    });

    it('should have uploader', (done) => {
      torrent.should.have.property('uploader');
      torrent.uploader.should.equal('YIFY');
      done();
    });

    it('should have uploader link', (done) => {
      torrent.should.have.property('uploaderLink');
      torrent.uploaderLink.should.equal(`${baseUrl}/user/YIFY/`);
      done();
    });

    it.skip('should have an info hash', (done) => {
      torrent.should.have.property('uploader');
      torrent.infoHash.should.equal('0259F6B98A7CA160A36F13457C89344C7DD34000');
      done();
    });

    it('should have an id', (done) => {
      torrent.should.have.property('id');
      torrent.id.should.equal('10676856');
      done();
    });

    it('should have upload date', (done) => {
      torrent.should.have.property('uploadDate');
      torrent.uploadDate.should.equal('2014-08-02 08:15:25 GMT');
      done();
    });

    it('should have size', (done) => {
      torrent.should.have.property('size');
      torrent.size.should.match(/\d+\.\d+\s(G|M|K)iB/);
      done();
    });

    it('should have seeders and leechers count', (done) => {
      torrent.should.have.property('seeders');
      torrent.should.have.property('leechers');
      (~~torrent.leechers).should.be.within(5, 100000);
      (~~torrent.seeders).should.be.within(5, 100000);
      done();
    });

    it('should have a link', (done) => {
      torrent.should.have.property('link');
      torrent.link.should.equal(`${baseUrl}/torrent/10676856`);
      done();
    });

    it('should have a magnet link', (done) => {
      torrent.should.have.property('magnetLink');
      // torrent.magnetLink.should.match('/magnet:\?xt=urn:btih:/');done()
    });

    it('should have a description', (done) => {
      torrent.should.have.property('description');
      torrent.description.should.be.a.String;
      done();
    });

    it('should have a picture', (done) => {
      torrent.should.have.property('picture');
      torrent.picture.should.be.a.String;
      done();
    });
  });
});
