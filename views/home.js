'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, Facets) {
  Facets.hashtagList.retrieveData(function(d){
    console.log(d.filter((x, i) => {return i < 10;}));
  })

  $scope.clear = function () {
    Facets.tweetList.clear();
  }
  
});