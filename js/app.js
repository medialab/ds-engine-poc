'use strict';

// Declare app level module which depends on views, and components
angular.module('thisApp', [
  'ngMaterial',
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
config(function($mdThemingProvider, $routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});

  $mdThemingProvider.theme('default')
    .primaryPalette('grey')
    .accentPalette('amber')
    .warnPalette('pink')
    .backgroundPalette('grey', {
      'default': '100'
    })

});