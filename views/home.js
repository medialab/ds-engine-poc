'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, FacetFactory) {
  let all = FacetFactory.newFacet('tweets.csv', {cached:true, dataFormat:'csv'});
  
  let tweetCount = FacetFactory.newFacet('tweetCount', {
    dependencies:['tweets.csv'],
    compute: function(){
      return FacetFactory.getFacet('tweets.csv').getData().length
    }
  })

  tweetCount.retrieveData(function(d){
    console.log('Retrieved data', d)
  })
});