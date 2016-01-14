'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, Facets) {
  Facets.tweetList.retrieveData(function(d){
    console.log(d)
  });
  // let htTimeFacet = Facets.getHashtagListForPeriod(1435733150000, 1435736100000);

  // htTimeFacet.retrieveData(function(d){
  //   console.log('hashtagList', d.filter((x, i) => {return i < 10;}) );
  //   console.log('tweetList', Facets.tweetList.getData().filter((x, i) => {return i < 10;}) );
  // })
  
});