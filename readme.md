The Pirate Bay node.js client 
=============================
[![Build Status](https://travis-ci.org/t3chnoboy/thepiratebay.svg?branch=master)](https://travis-ci.org/t3chnoboy/thepiratebay)
[![NPM version](https://badge.fury.io/js/thepiratebay.svg)](http://badge.fury.io/js/thepiratebay)
[![Dependency Status](https://gemnasium.com/t3chnoboy/thepiratebay.svg)](https://gemnasium.com/t3chnoboy/thepiratebay)


## Installation
[![NPM](https://nodei.co/npm/thepiratebay.png)](https://nodei.co/npm/thepiratebay/)  

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
