'use strict';

angular.module('thisApp.home', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/home.html'
  , controller: 'HomeController'
  })
}])

.controller('HomeController', function($scope, $location, FacetFactory) {
  const ff = FacetFactory;
  let f = ff.newFacet('jedi', {compute:function(){return {name:'Anakin Skywalker'}}});
  f.obtainData(function(d){
    console.log('Data:',d.name, d)
  })
});