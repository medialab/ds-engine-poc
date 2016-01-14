'use strict';

angular.module('thisApp.hashtags-overtime', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/hashtags-overtime', {
    templateUrl: 'views/hashtags-overtime.html'
  , controller: 'HashtagsOvertimeController'
  })
}])

.controller('HashtagsOvertimeController', function($scope, $location, Facets) {
  $scope.loading = true;
  loadFacets(() => {
    console.log('loaded');
  });

  function loadFacets(callback) {
    function finalize() {
      setTimeout(() => {
        $scope.loading = false;
        $scope.$apply();
        callback();
      }, 0);
    }

    Facets.tweetsTotalDaily.retrieveData(ttdData => {
      $scope.tweetsTotalDaily = ttdData;
      $scope.ttdGetTime = d => d.time;
      $scope.ttdGetVolume = d => d.count;
      finalize();
    });
    // let htTimeFacet = Facets.getHashtagListForPeriod(1435733150000, 1435736100000);
    // htTimeFacet.retrieveData(function(d){
    //   console.log('hashtagList', d.filter((x, i) => {return i < 10;}) );
    //   console.log('tweetList', Facets.tweetList.getData().filter((x, i) => {return i < 10;}) );
    // })
  }
  
});