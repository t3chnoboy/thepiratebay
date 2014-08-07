The Pirate Bay node.js client 
=============================
[![Build Status](https://travis-ci.org/t3chnoboy/thepiratebay.svg?branch=master)](https://travis-ci.org/t3chnoboy/thepiratebay)
[![NPM version](https://badge.fury.io/js/thepiratebay.svg)](http://badge.fury.io/js/thepiratebay)
[![Dependency Status](https://gemnasium.com/t3chnoboy/thepiratebay.svg)](https://gemnasium.com/t3chnoboy/thepiratebay)


## Installation
[![NPM](https://nodei.co/npm/thepiratebay.png?downloads=true)](https://nodei.co/npm/thepiratebay/)  

Install using npm:
```sh
npm install thepiratebay
```

## Usage

```javascript
tpb = require('thepiratebay');
```

using promises:
```javascript
tpb.search('Game of Thrones', {
	category: '205'
}).then(function(results){
	console.log(results);
}).catch(function(err){
	console.log(err);
});
```

using a callback:
```javascript
tpb.search('Pulp fiction', {
  category: '200',
}, function(err, results) {
  if (err) {
    console.log(err);
  } else {
    console.log(results);
  }
});
```

using ecmascript6 generators and co
```javascript
var co = require('co');

co(function *(){

  pulpFiction   = tpb.search('Pulp fiction', { category: '200'});
  killBill      = tpb.search('Kill Bill', {category: '200'});
  reservoirDogs = tpb.search('Reservoir Dogs',{category: '200'});

  movies = yield [pulpFiction, killBill, reservoirDogs];
  console.log(movies);

})();
```

##Sample output
```javascript
{
  name: 'Game of Thrones (2014)(dvd5) Season 4 DVD 1 SAM TBS',
  size: '4.17 GiB',
  link: 'http://thepiratebay.se/torrent/10013794/Game_of_Thrones_(2014)(dvd5)_Season_4_DVD_1_SAM_TBS',
  category: { id: '200', name: 'Video' },
  seeders: '125',
  leechers: '552',
  uploadDate: 'Today 00:57',
  magnetLink: 'magnet:?xt=urn:btih:4e6a2304fed5841c04b16d61a0bac5c67973acab&dn=Game+of+Thrones+%282014%29%28dvd5%29+Season+4+DVD+1+SAM+TBS&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Ftracker.ccc.de%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337',
  subcategory: { id: '202', name: 'Movies DVDR' },
  torrentLink: '//piratebaytorrents.info/10013794/Game_of_Thrones_(2014)(dvd5)_Season_4_DVD_1_SAM_TBS.10013794.TPB.torrent'
},
```
###Search query options:

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
