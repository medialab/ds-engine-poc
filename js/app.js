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
])
.config(function($mdThemingProvider, $routeProvider) {
  $routeProvider.otherwise({redirectTo: '/'});

  $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey')
    .accentPalette('light-green', {
      'default': '400',
      'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    })
    .warnPalette('pink')
    .backgroundPalette('grey', {
      'default': '50'
    })

})
// Other colors
.constant('colors', {
  primary: '#607D8B',
  accent: '#8BC34A'
})