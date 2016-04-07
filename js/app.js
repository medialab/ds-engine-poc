'use strict';

// Declare app level module which depends on views, and components
angular.module('thisApp', [
  'ngRoute',
  // Markdown renderer
  // 'yaru22.directives.md',
  'thisApp.services',
  'thisApp.directives',
  'thisApp.filters',
  'thisApp.home',
  'thisApp.hashtags-overtime',
  'thisApp.hashtags-users-overtime',
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});
}]);