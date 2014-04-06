var tpb = require('./');

//callback
tpb.search('game of thrones', null, function(err, response){
  console.log(response);
});

//promise
tpb.search('game of thrones')
.then(function(resp){
  console.log(resp);
});
