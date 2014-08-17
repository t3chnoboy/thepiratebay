scraper = require '../'

describe 'scraper', ->


  describe 'scraper.search(title, opts)', ->
    results = []

    before -->
      results = yield scraper.search 'Game of Thrones'

    it 'should return an array of search results', ->
      results.should.be.an.Array


    describe 'search result', ->

      it 'shold have a name', ->
        results[0].should.have.property 'name'
        results[0].name.should.match /game.of.thrones/i

      it 'should have upload date', ->
        results[0].should.have.property 'uploadDate'
        ###
        # Valid dates:
        #  31 mins ago
        #  Today 02:18
        #  Y-day 22:14
        #  02-10 03:36
        #  06-21 2011
        ###
        results[0].uploadDate.should.match /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/

      it 'should have size', ->
        results[0].should.have.property 'size'
        ###
        # Valid sizes:
        #  529.84 MiB
        #  2.04 GiB
        #  598.98 KiB
        ###
        results[0].size.should.match /\d+\.\d+\s(G|M|K)iB/

      it 'should have seeders and leechers count', ->
        results[0].should.have.property 'seeders'
        results[0].should.have.property 'leechers'
        (~~results[0].leechers).should.be.within 0, 100000
        (~~results[0].seeders).should.be.within 0, 100000

      it 'should have a link', ->
        results[0].should.have.property 'link'
        #e.g http://thepiratebay.se/torrent/9897245/Game_of_Thrones_Season_3_[Hard_Subs_in_English__AVI_format]
        results[0].link.should.match /http:\/\/thepiratebay.se\/torrent\/\d+\/.+/

      it 'should have a magnet link', ->
        results[0].should.have.property 'magnetLink'
        #e.g magnet:?xt=urn:btih:36c56414e0e491f824e25dcde0e8a4d520f8705c....
        results[0].magnetLink.should.match /magnet:\?xt=.+/

      it 'may have a torrent link', ->
        results[0].should.have.property 'torrentLink'
        #//piratebaytorrents.info/9897245/Game_of_Thrones_Season_3_[Hard_Subs_in_English__AVI_format].9897245.TPB.torrent
        results[0].torrentLink.should.match /\/\/piratebaytorrents\.info\/\d+\/.+\.torrent/ unless results[0].torrentLink isnt ''

      it 'should have a category', ->
        results[0].should.have.property 'category'
        results[0].category.id.should.match /[1-6]00/
        results[0].category.name.should.match /\w+/

      it 'should have a subcategory', ->
        results[0].should.have.property 'subcategory'
        results[0].subcategory.id.should.match /[1-6][09][1-9]/
        results[0].subcategory.name.should.match /[a-zA-Z0-9 ()/-]/


  describe 'scraper.getCategories()', ->

    categories = []

    before -->
      categories = yield scraper.getCategories()

    it 'should return an array of categories', ->
      categories.should.be.an.Array

    describe 'category', ->

      it 'should have an id', ->
        categories[0].should.have.property 'id'
        categories[0].id.should.match /\d00/

      it 'should have a name', ->
        categories[0].should.have.property 'name'
        categories[0].name.should.be.a.String

      it 'name should match id', ->
        video = categories.find (elem) -> elem.name is 'Video'
        video.id.should.be.equal '200'

      it 'shold have subcategories array', ->
        categories[0].should.have.property 'subcategories'
        categories[0].subcategories.should.be.an.Array

      describe 'subcategory', ->

        it 'should have an id', ->
          subcategory = categories[0].subcategories[0]
          subcategory.should.have.property 'id'
          subcategory.id.should.match /\d{3}/

        it 'should have a name', ->
          subcategory = categories[0].subcategories[0]
          subcategory.should.have.property 'name'
          subcategory.name.should.be.a.String


  describe 'scraper.topTorrents(category, opts)', ->

    results = []

    before -->
      results = yield scraper.topTorrents '205'

    it 'should return an array of top torrents of the selected category', ->
      results.should.be.an.Array

    describe 'search result', ->
      it 'category and subcategory shoud match specified category', ->
        results[0].category.name.should.be.equal 'Video'
        results[0].subcategory.name.should.be.equal 'TV shows'


  describe 'scraper.recentTorrents()', ->
    results = []

    before -->
      results = yield scraper.recentTorrents()

    it 'should return an array of the most recent torrents', ->
      results.should.be.an.Array

    describe 'recent torrent', ->
      it 'should be uploaded recently', ->
        recentTorrent = results[0]
        recentTorrent.uploadDate.should.match /\d+\smins?\sago/


  describe.skip 'scraper.tvShows()', ->
    tvShows = []

    before -->
      tvShows = yield scraper.tvShows()

    it 'should return an array', ->
      tvShows.should.be.an.Array

    describe 'tv show', ->

      it 'should have a title', ->
        tvShows[0].title.should.be.a.String

      it 'should have sesons list', ->
        tvShows[0].seasons.should.be.an.Array

      it 'season should be valid', ->
        tvShows[0].seasons[0].should.be 'S01'
