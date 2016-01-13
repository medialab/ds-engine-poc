'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, FacetFactory) {
  let tweets_csv = FacetFactory.newFacet('tweets.csv', {cached:true, dataFormat:'csv'});
  let tweetList = FacetFactory.newFacet('tweetList', {
    dependencies:['tweets.csv'],
    compute: function(){
      let tweets_csv = FacetFactory.getFacet('tweets.csv').getData();
      let data = [...tweets_csv].map(item => {
        item.time *= 1000;
        return item;
      });
      console.log(data);
      return data;
    },
    serialize: function(data){
      return data.map(item => {
        item.time = (new Date(item.time)).toISOString();
        return item;
      });
    },
    unserialize: function(data){
      return data.map(item => {
        item.time = new Date(item.time);
        return item;
      });
    },
  });
  
  let tweetCount = FacetFactory.newFacet('tweetCount', {
    dependencies:['tweetList'],
    compute: function(){
      return FacetFactory.getFacet('tweetList').getData().length;
    },
  })

  tweetCount.retrieveData(function(d){
    $scope.tweetCount = d;
    $scope.$apply();
  })
});