var baseUrl, scraper;
scraper = require('../');
baseUrl = 'http://thepiratebay.se';
scraper.setUrl(baseUrl);
describe('scraper', function() {
  describe('scraper.getTorrent(id)', function() {
    var torrent;
    torrent = {};
    before(function() {
      return torrent = yield(scraper.getTorrent(10676856));
    });

    return describe('torrent', function() {
      it('shold have a name', function() {
        torrent.should.have.property('name');
        return torrent.name.should.equal('The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY');
      });

      it.skip('should have a number of files', function() {
        torrent.should.have.property('filesCount');
        return torrent.filesCount.should.equal(2);
      });

      it.skip('should have tags', function() {
        torrent.should.have.property('tags');
        torrent.tags.should.be.an.Array;
        return torrent.tags.should.be(['YIFY', '720p', '1080p', 'movies', 'x264', 'Bluray', 'BrRip']);
      });

      it('should have uploader', function() {
        torrent.should.have.property('uploader');
        return torrent.uploader.should.equal('YIFY');
      });

      it('should have uploader link', function() {
        torrent.should.have.property('uploaderLink');
        return torrent.uploaderLink.should.equal("" + baseUrl + "/user/YIFY/");
      });

      it.skip('should have an info hash', function() {
        torrent.should.have.property('uploader');
        return torrent.infoHash.should.equal('0259F6B98A7CA160A36F13457C89344C7DD34000');
      });

      it('should have an id', function() {
        torrent.should.have.property('id');
        return torrent.id.should.equal('10676856');
      });

      it('should have upload date', function() {
        torrent.should.have.property('uploadDate');
        return torrent.uploadDate.should.equal('2014-08-02 08:15:25 GMT');
      });

      it('should have size', function() {
        torrent.should.have.property('size');
        return torrent.size.should.match(/\d+\.\d+\s(G|M|K)iB/);
      });

      it('should have seeders and leechers count', function() {
        torrent.should.have.property('seeders');
        torrent.should.have.property('leechers');
        (~~torrent.leechers).should.be.within(5, 100000);
        return (~~torrent.seeders).should.be.within(5, 100000);
      });

      it('should have a link', function() {
        torrent.should.have.property('link');
        return torrent.link.should.equal("" + baseUrl + "/torrent/10676856");
      });

      it('should have a magnet link', function() {
        torrent.should.have.property('magnetLink');
        return torrent.magnetLink.should.match(/magnet:\?xt=urn:btih:/);
      });

      it('may have a torrent link', function() {
        torrent.should.have.property('torrentLink');
        if (torrent.torrentLink === '') {
          return torrent.torrentLink.should.match(/\/\/piratebaytorrents\.info\/\d+\/.+\.torrent/);
        }
      });

      it.skip('should have a category', function() {
        torrent.should.have.property('category');
        torrent.category.id.should.match(/[1-6]00/);
        return torrent.category.name.should.match(/\w+/);
      });

      it.skip('should have a subcategory', function() {
        torrent.should.have.property('subcategory');
        torrent.subcategory.id.should.match(/[1-6][09][1-9]/);
        return torrent.subcategory.name.should.match(/[a-zA-Z0-9 ()/-]/);
      });

      it('should have a description', function() {
        torrent.should.have.property('description');
        return torrent.description.should.be.a.String;
      });

      return it('should have a picture', function() {
        torrent.should.have.property('picture');
        return torrent.picture.should.be.a.String;
      });

    });

  });

  describe('scraper.search(title, opts)', function() {
    var results;
    results = [];
    before(function() {
      return results = yield(scraper.search('Game of Thrones'));
    });

    it('should return an array of search results', function() {
      return results.should.be.an.Array;
    });

    return describe('search result', function() {
      it('should have an id', function() {
        results[0].should.have.property('id');
        return results[0].id.should.match(/^\d+$/);
      });

      it('should have a name', function() {
        results[0].should.have.property('name');
        return results[0].name.should.match(/game.of.thrones/i);
      });

      it('should have upload date', function() {
        results[0].should.have.property('uploadDate');
        /*
                # Valid dates:
                #  31 mins ago
                #  Today 02:18
                #  Y-day 22:14
                #  02-10 03:36
                #  06-21 2011
                */
        return results[0].uploadDate.should.match(/(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/);
      });

      it('should have size', function() {
        results[0].should.have.property('size');
        /*
                # Valid sizes:
                #  529.84 MiB
                #  2.04 GiB
                #  598.98 KiB
                */
        return results[0].size.should.match(/\d+\.\d+\s(G|M|K)iB/);
      });

      it('should have seeders and leechers count', function() {
        results[0].should.have.property('seeders');
        results[0].should.have.property('leechers');
        (~~results[0].leechers).should.be.within(0, 100000);
        return (~~results[0].seeders).should.be.within(0, 100000);
      });

      it('should have a link', function() {
        results[0].should.have.property('link');
        return results[0].link.should.match(new RegExp(baseUrl + '/torrent/\\d+/\.+'));
      });

      it('should have a magnet link', function() {
        results[0].should.have.property('magnetLink');
        return results[0].magnetLink.should.match(/magnet:\?xt=.+/);
      });

      it('may have a torrent link', function() {
        results[0].should.have.property('torrentLink');
        if (results[0].torrentLink === '') {
          return results[0].torrentLink.should.match(/\/\/piratebaytorrents\.info\/\d+\/.+\.torrent/);
        }
      });

      it('should have a category', function() {
        results[0].should.have.property('category');
        results[0].category.id.should.match(/[1-6]00/);
        return results[0].category.name.should.match(/\w+/);
      });

      it('should have a subcategory', function() {
        results[0].should.have.property('subcategory');
        results[0].subcategory.id.should.match(/[1-6][09][1-9]/);
        return results[0].subcategory.name.should.match(/[a-zA-Z0-9 ()/-]/);
      });

      return it('should have an uploader and uploader link', function() {
        results[0].should.have.property('uploader');
        return results[0].should.have.property('uploaderLink');
      });

    });

  });

  describe('scraper.getCategories()', function() {
    var categories;
    categories = [];
    before(function() {
      return categories = yield(scraper.getCategories());
    });

    it('should return an array of categories', function() {
      return categories.should.be.an.Array;
    });

    return describe('category', function() {
      it('should have an id', function() {
        categories[0].should.have.property('id');
        return categories[0].id.should.match(/\d00/);
      });

      it('should have a name', function() {
        categories[0].should.have.property('name');
        return categories[0].name.should.be.a.String;
      });

      it('name should match id', function() {
        var video;
        video = categories.find(function(elem) {
          return elem.name === 'Video';
        });

        return video.id.should.be.equal('200');
      });

      it('shold have subcategories array', function() {
        categories[0].should.have.property('subcategories');
        return categories[0].subcategories.should.be.an.Array;
      });

      return describe('subcategory', function() {
        it('should have an id', function() {
          var subcategory;
          subcategory = categories[0].subcategories[0];
          subcategory.should.have.property('id');
          return subcategory.id.should.match(/\d{3}/);
        });

        return it('should have a name', function() {
          var subcategory;
          subcategory = categories[0].subcategories[0];
          subcategory.should.have.property('name');
          return subcategory.name.should.be.a.String;
        });

      });

    });

  });

  describe('scraper.topTorrents(category, opts)', function() {
    var results;
    results = [];
    before(function() {
      return results = yield(scraper.topTorrents('205'));
    });

    it('should return an array of top torrents of the selected category', function() {
      return results.should.be.an.Array;
    });

    return describe('search result', function() {
      return it('category and subcategory shoud match specified category', function() {
        results[0].category.name.should.be.equal('Video');
        return results[0].subcategory.name.should.be.equal('TV shows');
      });

    });

  });

  describe('scraper.recentTorrents()', function() {
    var results;
    results = [];
    before(function() {
      return results = yield(scraper.recentTorrents());
    });

    it('should return an array of the most recent torrents', function() {
      return results.should.be.an.Array;
    });

    return describe('recent torrent', function() {
      return it('should be uploaded recently', function() {
        var recentTorrent;
        recentTorrent = results[0];
        return recentTorrent.uploadDate.should.match(/\d+\smins?\sago/);
      });

    });

  });

  describe('scraper.userTorrents(userName, opts)', function() {
    var results;
    results = [];
    before(function() {
      return results = yield(scraper.userTorrents('YIFY'));
    });

    it('should return an array of the user torrents', function() {
      return results.should.be.an.Array;
    });

    return describe('user torrent', function() {
      it('should have a name', function() {
        return results[0].should.have.property('name');
      });

      it('should have upload date', function() {
        results[0].should.have.property('uploadDate');
        /*
                # Valid dates:
                #  31 mins ago
                #  Today 02:18
                #  Y-day 22:14
                #  02-10 03:36
                #  06-21 2011
                */
        return results[0].uploadDate.should.match(/(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/);
      });

      it('should have size', function() {
        results[0].should.have.property('size');
        /*
                # Valid sizes:
                #  529.84 MiB
                #  2.04 GiB
                #  598.98 KiB
                */
        return results[0].size.should.match(/\d+\.\d+\s(G|M|K)iB/);
      });

      it('should have seeders and leechers count', function() {
        results[0].should.have.property('seeders');
        results[0].should.have.property('leechers');
        (~~results[0].leechers).should.be.within(0, 100000);
        return (~~results[0].seeders).should.be.within(0, 100000);
      });

      it('should have a link', function() {
        results[0].should.have.property('link');
        return results[0].link.should.match(new RegExp(baseUrl + '/torrent/\\d+/\.+'));
      });

      it('should have a magnet link', function() {
        results[0].should.have.property('magnetLink');
        return results[0].magnetLink.should.match(/magnet:\?xt=.+/);
      });

      it('may have a torrent link', function() {
        results[0].should.have.property('torrentLink');
        if (results[0].torrentLink === '') {
          return results[0].torrentLink.should.match(/\/\/piratebaytorrents\.info\/\d+\/.+\.torrent/);
        }
      });

      it('should have a category', function() {
        results[0].should.have.property('category');
        results[0].category.id.should.match(/[1-6]00/);
        return results[0].category.name.should.match(/\w+/);
      });

      return it('should have a subcategory', function() {
        results[0].should.have.property('subcategory');
        results[0].subcategory.id.should.match(/[1-6][09][1-9]/);
        return results[0].subcategory.name.should.match(/[a-zA-Z0-9 ()/-]/);
      });

    });

  });

  describe('scraper.tvShows()', function() {
    var tvShows;
    tvShows = [];
    before(function() {
      return tvShows = yield(scraper.tvShows());
    });

    it('should return an array', function() {
      return tvShows.should.be.an.Array;
    });

    return describe('tv show', function() {
      it('should have a title', function() {
        return tvShows[0].title.should.be.a.String;
      });

      it('should have an id', function() {
        return tvShows[0].id.should.match(/^\d+$/);
      });

      it('should have sesons list', function() {
        tvShows[0].seasons.should.be.an.Array;
        return tvShows[0].seasons.length.should.be.greaterThan(0);
      });

      return it('season number should be valid', function() {
        return tvShows[0].seasons[0].should.match(/^S\d+$/);
      });

    });

  });

  return describe('scraper.getTvShow(id)', function() {
    var tvShow;
    tvShow = {};
    before(function() {
      return tvShow = yield(scraper.getTvShow('2'));
    });

    it('should return an array of seasons', function() {
      return tvShow.should.be.an.Array;
    });

    return describe('season', function() {
      it('should have a title', function() {
        tvShow[0].title.should.be.a.String;
        return tvShow[0].title.should.match(/^S\d+$/);
      });

      it('should have an array of torrents', function() {
        return tvShow[0].torrents.should.be.an.Array;
      });

      return describe('link', function() {
        it('should have a title', function() {
          return tvShow[0].torrents[0].title.should.be.a.String;
        });

        it('should have a link', function() {
          return tvShow[0].torrents[0].link.should.be.a.String;
        });

        return it('should have an id', function() {
          return tvShow[0].torrents[0].id.should.match(/^\d+$/);
        });

      });

    });

  });

});
