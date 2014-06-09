scraper = require '../'

describe 'scraper', ->

  describe 'scraper.search(title, opts)', ->
    it 'should return an array of search results', -->

      results = yield scraper.search 'Game of Thrones'
      results.should.be.an.Array

      describe 'search result', ->
        searchResult = results[0]

        it 'shold have a name', ->
          searchResult.should.have.property 'name'
          searchResult.name.should.match /game.of.thrones/i

        it 'should have upload date', ->
          searchResult.should.have.property 'uploadDate'
          ###
          # Valid dates:
          #  31 mins ago
          #  Today 02:18
          #  Y-day 22:14
          #  02-10 03:36
          #  06-21 2011
          ###
          searchResult.uploadDate.should.match /(\d*\smins\sago)|(Today|Y-day)\s\d\d:\d\d|\d\d-\d\d\s(\d\d:\d\d|\d{4})/

        it 'should have size', ->
          searchResult.should.have.property 'size'
          ###
          # Valid sizes:
          #  529.84 MiB
          #  2.04 GiB
          #  598.98 KiB
          ###
          searchResult.size.should.match /\d+\.\d+\s(G|M|K)iB/

        it 'should have seeders and leechers count', ->
          searchResult.should.have.property 'seeders'
          searchResult.should.have.property 'leechers'
          (~~searchResult.leechers).should.be.within 0, 100000
          (~~searchResult.seeders).should.be.within 0, 100000

        it 'should have a link', ->
          searchResult.should.have.property 'link'
          #e.g http://thepiratebay.se/torrent/9897245/Game_of_Thrones_Season_3_[Hard_Subs_in_English__AVI_format]
          searchResult.link.should.match /http:\/\/thepiratebay.se\/torrent\/\d+\/.+/

        it 'should have a magnet link', ->
          searchResult.should.have.property 'magnetLink'
          #e.g magnet:?xt=urn:btih:36c56414e0e491f824e25dcde0e8a4d520f8705c....
          searchResult.magnetLink.should.match /magnet:\?xt=.+/

        it 'may have a torrent link', ->
          searchResult.should.have.property 'torrentLink'
          #//piratebaytorrents.info/9897245/Game_of_Thrones_Season_3_[Hard_Subs_in_English__AVI_format].9897245.TPB.torrent
          searchResult.torrentLink.should.match /\/\/piratebaytorrents\.info\/\d+\/.+\.torrent/ unless searchResult.torrentLink isnt ''

        it 'should have a category', ->
          searchResult.should.have.property 'category'
          searchResult.category.id.should.match /[1-6]00/
          searchResult.category.name.should.match /\w+/

        it 'should have a subcategory', ->
          searchResult.should.have.property 'subcategory'
          searchResult.subcategory.id.should.match /[1-6][09][1-9]/
          searchResult.subcategory.name.should.match /[a-zA-Z0-9 ()/-]/

  describe.skip 'scraper.getCategories()', ->

    it 'should return an array of categories', -->
      categories = yield scraper.getCategories()
      categories.should.be.an.Array

      describe 'category', ->
        category = categories[0]

        it 'should have an id', ->
          category.should.have.property 'id'
          category.id.should.match /\d00/

        it 'should have a name', ->
          category.should.have.property 'name'
          category.name.should.be.a.String

        it 'name should match id', ->
          video = categories.find (elem) -> elem.name is 'Video'
          video.id.should.be.equal '200'

        it 'shold have subcategories array', ->
          category.should.have.property 'subcategories'
          category.subcategories.should.be.an.Array

          describe 'subcategory', ->
            subcategory = category.subcategories[0]

            it 'should have an id', ->
              subcategory.should.have.property 'id'
              subcategory.id.should.match /\d{3}/

            it 'should have a name', ->
              subcategory.should.have.property 'name'
              subcategory.name.should.be.a.String



  describe.skip 'scraper.topTorrents(category, opts)', ->
    it 'should return an array of top torrents of the selected category', -->
      results = yield scraper.topTorrents '205'
      results.should.be.an.Array

      describe 'search result', ->
        searchResult = results[0]

        it 'category and subcategory shoud match specified category', ->
          searchResult.category.name.should.be.equal 'Video'
          searchResult.subcategory.name.should.be.equal 'TV shows'

  describe.skip 'scraper.recentTorrents()', ->
    it 'should return an array of the most recent torrents', -->
      results = yield scraper.recentTorrents()
      results.should.be.an.Array

      describe 'recent torrent', ->
        recentTorrent = results[0]
        it 'should be uploaded recently', ->
          recentTorrent.uploadDate.should.match /\d+\smins?\sago/
