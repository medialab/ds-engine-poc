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
  $scope.selectedHashtag;
  
  loadFacets(() => {
    // No callback here
  });

  // time extent slow update
  $scope.$on('brushEnded', function(event) {
    $scope.startTime_slowUpdate = $scope.startTime;
    $scope.endTime_slowUpdate = $scope.endTime;
  });
  $scope.$watchGroup(['startTime_slowUpdate', 'endTime_slowUpdate'], function(newValues, oldValues, scope) {
    $scope.startTime = newValues[0];
    $scope.endTime = newValues[1];
  })


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
      var extent = d3.extent(ttdData.map(d => d.time));
      $scope.timeMin = extent[0];
      $scope.timeMax = extent[1];
      finalize();
    });
    // var htTimeFacet = Facets.getHashtagListForPeriod(1435733150000, 1435736100000);
    // htTimeFacet.retrieveData(function(d){
    //   console.log('hashtagList', d.filter((x, i) => {return i < 10;}) );
    //   console.log('tweetList', Facets.tweetList.getData().filter((x, i) => {return i < 10;}) );
    // })
  }
  
});