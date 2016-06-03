const PirateBay = require('./');


// Promise
PirateBay
  .search('game of thrones')
  .then(response => {
    console.log(response);
  });

// Async/Await
async function searchPirateBay() {
  const searchResults = await PirateBay
    .search('game of thrones')
    .then(response => {
      console.log(response);
    });

  console.log(searchResults);
}
