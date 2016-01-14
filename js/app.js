'use strict';

// Declare app level module which depends on views, and components
angular.module('thisApp', [
  'ngRoute',
  'angucomplete-alt',
  // Markdown renderer
  'yaru22.directives.md',
  'thisApp.services',
  'thisApp.directives',
  'thisApp.home',
  'thisApp.hashtags-overtime',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});
}]);