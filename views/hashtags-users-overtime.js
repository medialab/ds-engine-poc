'use strict';

angular.module('thisApp.hashtags-users-overtime', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/hashtags-users-overtime', {
    templateUrl: 'views/hashtags-users-overtime.html'
  , controller: 'HashtagsUsersOvertimeController'
  })
}])

.controller('HashtagsUsersOvertimeController', function($scope, $location, Facets) {
  $scope.loading = true;
  
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

    Facets.usersOrientation.retrieveData(usersOrientation => {

      $scope.mask = buildOrientationMask(usersOrientation);

      Facets.tweetsTotalDaily.retrieveData(ttdData => {
        $scope.tweetsTotalDaily = ttdData;
        $scope.ttdGetTime = d => d.time;
        $scope.ttdGetVolume = d => d.count;
        let extent = d3.extent(ttdData.map(d => d.time));
        $scope.timeMin = extent[0];
        $scope.timeMax = extent[1];
        finalize();
      });      
    });

  }

  function buildOrientationMask(orientations) {
    const colorCode = {
      'Right-wing': "#0769D3",
      'Left-wing': "#B92106",
      'Media \'left-wing\'': "#B92106",
      'Media \'right-wing\'': "#0769D3",
      // 'Neutral': "#989251",
    };
    let mask = {nodes:{}};
    orientations.forEach(o => {
      if (colorCode[o.orientation]) {
        mask.nodes['@'+o.user] = {color: colorCode[o.orientation]}
      }
    })
    return mask;
  }
  
});