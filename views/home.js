'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, Facets) {
  Facets.tweetCount.retrieveData(function(d){
    $scope.tweetCount = d;
    $scope.$apply();
  });
});