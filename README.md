The Pirate Bay node.js client
=============================

![Test](https://github.com/t3chnoboy/thepiratebay/workflows/Test/badge.svg)
[![NPM version](https://badge.fury.io/js/thepiratebay.svg)](http://badge.fury.io/js/thepiratebay)
[![Dependency Status](https://img.shields.io/david/t3chnoboy/thepiratebay.svg)](https://david-dm.org/t3chnoboy/thepiratebay)
[![npm](https://img.shields.io/npm/dm/thepiratebay.svg?maxAge=2592000)](https://npm-stat.com/charts.html?package=thepiratebay)

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/1/16/The_Pirate_Bay_logo.svg" width="300px"/>
</p>

## Installation

Install using npm:
```bash
# NPM
npm install thepiratebay
# Yarn
yarn add thepiratebay
```

## Usage

```js
import PirateBay from 'thepiratebay'

const searchResults = await PirateBay.search('harry potter', {
  category: 'video',
  page: 3
})
console.log(searchResults)
```

## Methods

### search
```js
// Takes a search query and options
await PirateBay.search('Game of Thrones', {
  category: 'all',    // default - 'all' | 'all', 'audio', 'video', 'xxx',
                      //                   'applications', 'games', 'other'
                      //
                      // You can also use the category number:
                      // `/search/0/99/{category_number}`
  filter: {
    verified: false    // default - false | Filter all VIP or trusted torrents
  },
  page: 0,            // default - 0 - 99
  orderBy: 'leeches', // default - name, date, size, seeds, leeches
  sortBy: 'desc'      // default - desc, asc
})

/* Returns an array of search results
[
  {
    name: 'Game of Thrones (2014)(dvd5) Season 4 DVD 1 SAM TBS',
    size: '4.17 GiB',
    link: 'http://thepiratebay.se/torrent/10013794/Game_of_Thron...'
    category: { id: '200', name: 'Video' },
    seeders: '125',
    leechers: '552',
    uploadDate: 'Today 00:57',
    magnetLink: 'magnet:?xt=urn:btih:4e6a2304fed5841c04b16d61a0ba...
    subcategory: { id: '202', name: 'Movies DVDR' }
  },
  ...
]
*/
```

### getTorrent
```js
// takes an id or a link
await PirateBay.getTorrent('10676856')

/* Returns a single torrent's description
{
  name: 'The Amazing Spider-Man 2 (2014) 1080p BrRip x264 - YIFY',
  filesCount: 2,
  size: '2.06 GiB (2209149731 Bytes)',
  seeders: '14142',
  leechers: '3140',
  uploadDate: '2014-08-02 08:15:25 GMT',
  magnetLink: 'magnet:?xt=urn:btih:025....
  link: 'http://thepiratebay.se/torrent/10676856/',
  id: '10676856',
  description: 'I've always known that Spider-Man...'
}
*/
```

### topTorrents
```js
// returns top 100 torrents
await PirateBay.topTorrents()

// returns top 100 torrents for the category '400' aka Games
await PirateBay.topTorrents(400)
```

### recentTorrents
```js
// returns the most recent torrents
await PirateBay.recentTorrents()
```

### userTorrents
```js
// Gets a specific user's torrents
await PirateBay.userTorrents('YIFY', {
  page: 3,
  orderBy: 'name',
  sortBy: 'asc'
})
```

### getCategories
```js
// Gets all available categories on piratebay
PirateBay.getCategories()

/* Returns an array of categories and subcategories
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

## Configuration
### Endpoint
You can customize your endpoint by setting the environment variable `THEPIRATEBAY_DEFAULT_ENDPOINT`!
```bash
THEPIRATEBAY_DEFAULT_ENDPOINT=http://some-endpoint.com node some-script.js
```

## Used by:
* [popcorn-time-desktop](https://github.com/amilajack/popcorn-time-desktop)
