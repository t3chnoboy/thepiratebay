The Pirate Bay node.js client
=============================
[![Build Status](https://travis-ci.org/t3chnoboy/thepiratebay.svg?branch=master)](https://travis-ci.org/t3chnoboy/thepiratebay)
[![NPM version](https://badge.fury.io/js/thepiratebay.svg)](http://badge.fury.io/js/thepiratebay)
[![Dependency Status](https://gemnasium.com/t3chnoboy/thepiratebay.svg)](https://gemnasium.com/t3chnoboy/thepiratebay)

<p align="center">
  <img src="https://i.imgur.com/xP3s8Xum.png"/>
</p>

## Installation
[![NPM](https://nodei.co/npm/thepiratebay.png?downloads=true)](https://nodei.co/npm/thepiratebay/)

Install using npm:
```sh
npm install thepiratebay
```

## Usage

```javascript
  const tpb = require('thepiratebay');
```
All methods are asynchronous!
You can use promises, es6 generators, or async/await

Using promises:
```javascript
  tpb.search('Game of Thrones', {
  	category: '205'
  })
  .then(function(results){
  	console.log(results);
  })
  .catch(function(err){
  	console.log(err);
  });
```

Using ES7 async/await
```javascript
async search() {
  const searchResults = await tpb.search({
    category: '205', page: '3', orderBy: '5'
  })
}
```

## Methods

### getTorrent
```javascript
  // takes an id or a link
  tpb
    .getTorrent('10676856')
    .then(function(results){
      console.log(results);
    })
    .catch(function(err){
      console.log(err);
    });

/*
output:
  {
    name: 'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY',
    filesCount: 2,
    size: '2.06 GiB (2209149731 Bytes)',
    seeders: '14142',
    leechers: '3140',
    uploadDate: '2014-08-02 08:15:25 GMT',
    torrentLink: undefined,
    magnetLink: 'magnet:?xt=urn:btih:025....
    link: 'http://thepiratebay.se/torrent/10676856/',
    id: '10676856',
    description: 'I've always known that Spider-Man...',
    picture: 'http://image.bayimg.com/bdca01a243abf68...'
  }
*/
```

### topTorrents
http://thepiratebay.se/top
```javascript
  // returns top 100 torrents
  tpb.topTorrents()

  // returns top 100 torrents for the category '400' aka Games
  tpb.topTorrents('400')
```

### recentTorrents
http://thepiratebay.se/recent
```javascript
  // returns the most recent torrents
  tpb.recentTorrents()
```

### userTorrents
http://thepiratebay.se/user/YIFY/3/5/0
```javascript
  // Gets a specific user's torrents
  tpb.userTorrents('YIFY', { page: '3', orderBy: '5' })
```

### getCategories
```javascript
  // Gets all available categories on piratebay
  tpb.getCategories();

/*
[
  { name: 'Video',
    id: '200',
    subcategories:
     [ { id: '201', name: 'Movies' },
       { id: '202', name: 'Movies DVDR' },
       { id: '203', name: 'Music videos' },
       { id: '204', name: 'Movie clips' },
       { id: '205', name: 'TV shows' },
       { id: '206', name: 'Handheld' },
       { id: '207', name: 'HD - Movies' },
       { id: '208', name: 'HD - TV shows' },
       { id: '209', name: '3D' },
       { id: '299', name: 'Other' } ]
     }
  ...
]
*/
```
### search
```javascript
  // takes a search query and options
  tpb.search('Game of Thrones', { category: '205', page: '3', orderBy: '5' })

/* returns an array of search results:
[
  {
    name: 'Game of Thrones (2014)(dvd5) Season 4 DVD 1 SAM TBS',
    size: '4.17 GiB',
    link: 'http://thepiratebay.se/torrent/10013794/Game_of_Thron...
    category: { id: '200', name: 'Video' },
    seeders: '125',
    leechers: '552',
    uploadDate: 'Today 00:57',
    magnetLink: 'magnet:?xt=urn:btih:4e6a2304fed5841c04b16d61a0ba...
    subcategory: { id: '202', name: 'Movies DVDR' },
    torrentLink: '//piratebaytorrents.info/10013794/Game_of_Thron...
  },
  ...
]
*/
```
#### Search query options:

* category
  * 0   - all
  * 101 - 699
* page
  * 0 - 99
* orderBy
  * 1  - name desc
  * 2  - name asc
  * 3  - date desc
  * 4  - date asc
  * 5  - size desc
  * 6  - size asc
  * 7  - seeds desc
  * 8  - seeds asc
  * 9  - leeches desc
  * 10 - leeches asc
