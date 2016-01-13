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
  all.obtainData(function(d){
    console.log('Data:', d);
  })
});