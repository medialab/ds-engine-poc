'use strict';

/* Services */

angular.module('thisApp.directives', [])

  .directive('ngPressEnter', function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$eval(attrs.ngPressEnter)
          event.preventDefault()
          scope.$apply()
        }
      })
    }
  })

  // A simple curve that can be synchronized to a brush
  .directive('dailyCount', function ($timeout, colors) {
    return {
      restrict: 'E',
      scope: {
        data: '=',
        timeAccessor: '=',
        volumeAccessor: '=',
        from: '=',
        to: '=',
      },
      link: function($scope, el, attrs) {
        var elId = el.attr('id')
        if (!elId) {console.log('Element id missing -> causes issues')};

        el.html('<div class="simple-curve">Loading...</div>');

        $scope.$watch('data', () => {
          if ($scope.data !== undefined){
            $timeout(() => {

              var data = $scope.data;
              var getTime = $scope.timeAccessor;
              var getVolume = $scope.volumeAccessor;
              $(`#${elId} .simple-curve`).html('');

              var margin = {top: 10, right: 40, bottom: 30, left: 40},
                  width = $(`#${elId} .brush-curve`).width() - margin.left - margin.right,
                  height = 300 - margin.top - margin.bottom

              var parseDate = d3.time.format("%b %Y").parse;

              var x = d3.time.scale().range([0, width]),
                  y = d3.scale.linear().range([height, 0])

              var xAxis = d3.svg.axis().scale(x).orient("bottom"),
                  yAxis = d3.svg.axis().scale(y).orient("left");

              var area = d3.svg.area()
                  .interpolate("monotone")
                  .x(function(d) { return x(getTime(d)); })
                  .y0(height)
                  .y1(function(d) { return y(getVolume(d)); });

              var svg = d3.select(`#${elId} .simple-curve`).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .style('font', '10px sans-serif');

              svg.append("defs").append("clipPath")
                  .attr("id", `${elId}-clip`)
                .append("rect")
                  .attr("width", width)
                  .attr("height", height);

              var focus = svg.append("g")
                  .attr("class", "focus")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              x.domain(d3.extent(data.map(getTime)));
              y.domain([0, d3.max(data.map(getVolume))]);

              focus.append("path")
                  .datum(data)
                  .attr("class", "area")
                  .attr("d", area)
                  .style('fill', colors.accent)
                  .style('clip-path', `url(#${elId}-clip)`);

              focus.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis);

              focus.append("g")
                  .attr("class", "y axis")
                  .call(yAxis);

              d3.selectAll(`#${elId} .axis path, #${elId} .axis line`)
                .style('fill', 'none')
                .style('stroke', '#000')
                .style('shape-rendering', 'crispEdges')

              // Listen to angular
              $scope.$watchGroup(['from', 'to'], function(newValues, oldValues, scope) {
                var from = newValues[0];
                var to = newValues[1];
                var extent;
                if (from && to) {
                  extent = [new Date(from), new Date(to)];
                  updateBrush(extent);
                }
              })

              function updateBrush(extent) {
                x.domain(extent);
                focus.select(".area").attr("d", area);
                focus.select(".x.axis").call(xAxis);
              }
            }, 0, false);
          }
        });
      },
    }
  })
  
  // A curve with a brush
  .directive('dailyCountBrushable', function ($timeout, colors) {
    return {
      restrict: 'E',
      scope: {
        data: '=',
        timeAccessor: '=',
        volumeAccessor: '=',
        from: '=',
        to: '=',
      },
      link: function($scope, el, attrs) {
        var elId = el.attr('id')
        if (!elId) {console.log('Element id missing -> causes issues')};

        el.html('<div class="brush-curve">Loading...</div>');

        window.addEventListener('resize', redraw);
        $scope.$on('$destroy', function(){
          window.removeEventListener('resize', redraw)
        })

        $scope.$watch('data', redraw);

        function redraw() {
          if ($scope.data !== undefined){
            $timeout(() => {
              el.html('<div class="brush-curve">Loading...</div>');

              var data = $scope.data;
              var getTime = $scope.timeAccessor;
              var getVolume = $scope.volumeAccessor;
              $(`#${elId} .brush-curve`).html('');

              var margin = {top: 10, right: 40, bottom: 20, left: 40},
                  width = $(`#${elId} .brush-curve`).width() - margin.left - margin.right - 6,
                  height = 100 - margin.top - margin.bottom;

              var parseDate = d3.time.format("%b %Y").parse;

              var x2 = d3.time.scale().range([0, width]),
                  y2 = d3.scale.linear().range([height, 0]);

              var xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                  yAxis = d3.svg.axis().scale(y2).orient("left");

              var brush = d3.svg.brush()
                  .x(x2)
                  .on("brush", brushed)
                  .on("brushend", brushEnded);

              var area2 = d3.svg.area()
                  .interpolate("monotone")
                  .x(function(d) { return x2(getTime(d)); })
                  .y0(height)
                  .y1(function(d) { return y2(getVolume(d)); });

              var svg = d3.select(`#${elId} .brush-curve`).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .style('font', '10px sans-serif');

              var context = svg.append("g")
                  .attr("class", "context")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

              x2.domain(d3.extent(data.map(getTime)));
              y2.domain([0, d3.max(data.map(getVolume))]);

              context.append("path")
                  .datum(data)
                  .attr("class", "area")
                  .attr("d", area2)
                  .style('fill', colors.accent)
                  .style('clip-path', `url(#${elId}-clip)`);

              context.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(xAxis2);

              context.append("g")
                  .attr("class", "x brush")
                  .call(brush)
                .selectAll("rect")
                  .attr("y", -6)
                  .attr("height", height + 7);

              d3.selectAll(`#${elId} .axis path, #${elId} .axis line`)
                .style('fill', 'none')
                .style('stroke', '#000')
                .style('shape-rendering', 'crispEdges');

              d3.selectAll(`#${elId} .brush .extent `)
                .style('stroke', '#fff')
                .style('fill-opacity', '.125')
                .style('shape-rendering', 'crispEdges');

              // Listen to angular
              $scope.$watchGroup(['from', 'to'], function(newValues, oldValues, scope) {
                var from = newValues[0];
                var to = newValues[1];
                var extent;
                if (from && to) {
                  extent = [new Date(from), new Date(to)];
                  brush.extent(extent);
                  svg.select(".brush").call(brush);
                }
              })

              function brushed() {
                var extent = brush.extent();
                $scope.from = extent[0].getTime();
                $scope.to = extent[1].getTime();
                $scope.$apply();
              }

              function brushEnded() {
                $scope.$emit('brushEnded');
                $scope.$apply();
              }
            }, 0, false);
          }
        }
      },
    }
  })

  .directive('hashtagLine', function (){
    return {
      restrict: 'E',
      scope: {
        item: '=',
        selected: '=',
      },
      templateUrl: 'partials/hashtagLine.html',
    }
  })

  .directive('tweetLine', function (){
    return {
      restrict: 'E',
      scope: {
        tweet: '=',
      },
      templateUrl: 'partials/tweetLine.html',
    }
  })

  .directive('sigmaNetwork', function ($window, $timeout){
    return {
      retrict: 'E',
      scope: {
        network: '=',
        mask: '=',
      },
      templateUrl: 'partials/sigmaNetwork.html',
      link: function($scope, el, attrs) {
        $scope.pending = true;
        var sigmaInstance;
        var internalMask = {
          nodes: {},
        };

        $scope.spatializationRunning = true;

        $scope.$watchGroup(['network', 'mask'], function (newValues, oldValues, $scope) {
          var network = newValues[0];
          if (!$scope.mask) {
            $scope.mask = {nodes:{}};
          }
          if (network) {
            $scope.pending = false;
            $timeout(() => {
              $scope.stopSpatialization();
              killSigma();
              initSigma();
            }, 0, false);
          }
        });

        // Sigma stuff
        $scope.$on("$destroy", () => {
          killSigma();
        });

        $scope.sigmaRecenter = function  (){
          var c = sigmaInstance.cameras[0];
          c.goTo({
            ratio: 1,
            x: 0,
            y: 0,
          });
        }

        $scope.sigmaZoom = function () {
          var c = sigmaInstance.cameras[0];
          c.goTo({
            ratio: c.ratio / c.settings('zoomingRatio')
          });
        }

        $scope.sigmaUnzoom = function () {
          var c = sigmaInstance.cameras[0];
          c.goTo({
            ratio: c.ratio * c.settings('zoomingRatio')
          })
        }

        $scope.toggleSpatialization = function () {
          if ($scope.spatializationRunning) {
            sigmaInstance.stopForceAtlas2();
            $scope.spatializationRunning = false;
          } else {
            sigmaInstance.startForceAtlas2();
            $scope.spatializationRunning = true;
          }
        }

        $scope.runSpatialization = function () {
          $scope.spatializationRunning = true;
          sigmaInstance.startForceAtlas2();
        }

        $scope.stopSpatialization = function () {
          $scope.spatializationRunning = false;
          if (sigmaInstance) {
            sigmaInstance.killForceAtlas2();
          }
        }

        function initSigma () {
          sigmaInstance = new sigma('sigma');
          // For debugging purpose
          $window.s = sigmaInstance;

          sigmaInstance.settings({
            font: 'Roboto Condensed',
            defaultLabelColor: '#666',
            edgeColor: 'default',
            defaultEdgeColor: '#ECE8E5',
            defaultNodeColor: '#999',
            minNodeSize: 2,
            maxNodeSize: 10,
            zoomMax: 5,
            zoomMin: 0.002,
            labelThreshold: 6,
          });

          // Populate
          $window.g = $scope.network;
          sigmaInstance.graph.read($scope.network);
          applyMasks();

          // Force Atlas 2 settings
          sigmaInstance.configForceAtlas2({
            slowDown: 2 * (1 + Math.log($scope.network.nodes.length)),
            worker: true,
            scalingRatio: 10,
            strongGravityMode: true,
            gravity: 0.1,
            barnesHutOptimize: $scope.network.nodes.length > 1000,
          });

          // Bind interactions
          sigmaInstance.bind('overNode', e => {
            if (Object.keys(e.data.captor).length > 0) {  // Sigma bug turnaround
              $scope.overNode = true;
              $scope.$apply();
            }
          });

          sigmaInstance.bind('outNode', e => {
            if (Object.keys(e.data.captor).length > 0) {  // Sigma bug turnaround
              $scope.overNode = false;
              $scope.$apply();
            }
          });

          sigmaInstance.bind('clickNode', e => {
            // TODO: do something on node click
            // let path = '...';
            // $window.open(path, '_blank');
          });

          $scope.runSpatialization();
        }

        function killSigma(){
          if (sigmaInstance) {
            updateMasks();
            $scope.stopSpatialization();
            sigmaInstance.kill();
          }
        }

        function updateMasks() {
          [internalMask, $scope.mask].forEach(mask => {
            sigmaInstance.graph.nodes().forEach(n => {
              mask.nodes[n.id] = {};
              ['x', 'y', 'size', 'color'].forEach(attr => {
                mask.nodes[n.id][attr] = n[attr];
              })
            });            
          });
        }

        function applyMasks() {
          [internalMask, $scope.mask].forEach(mask => {
            sigmaInstance.graph.nodes().forEach(n => {
              var nMask = mask.nodes[n.id];
              if (nMask) {
                ['x', 'y', 'size', 'color'].forEach(attr => {
                  if (nMask[attr]) { n[attr] = nMask[attr]; }
                })
              }
            });
          });
        }

      }
    }
  })

  .directive('hashtagsUsersByPeriod', function (Facets, $timeout){
    return {
      restrict: 'E',
      scope: {
        from: '=',
        to: '=',
        defaultFrom: '=',
        defaultTo: '=',
        mask: '=',
        tweetsLimit: '=',
        hashtagsMinDegree: '=',
        usersMinDegree: '=',
        hashtagsLimit: '=',
        usersLimit: '=',
      },
      templateUrl: 'partials/hashtagsUsersByPeriod.html',
      link: function($scope, el, attrs) {
        $scope.loading = true;
        $scope.$watchGroup(['from', 'to', 'defaultFrom', 'defaultTo'], function (newValues, oldValues, $scope) {
          var from = newValues[0];
          var to = newValues[1];
          var defaultFrom = newValues[2];
          var defaultTo = newValues[3];
          if (from && to && from != to) {
            displayFacet(from, to, $scope.tweetsLimit, $scope.hashtagsMinDegree, $scope.usersMinDegree, $scope.hashtagsLimit, $scope.usersLimit);
          } else if (defaultFrom && defaultTo) {
            displayFacet(defaultFrom, defaultTo, $scope.tweetsLimit, $scope.hashtagsMinDegree, $scope.usersMinDegree, $scope.hashtagsLimit, $scope.usersLimit);
          }
        })

        function displayFacet(from, to, tweetsLimit, hashtagsMinDegree, usersMinDegree, hashtagsLimit, usersLimit) {
          if (from && to){
            $scope.loading = true;
            $timeout(() => {
              Facets.getHashtagUserNetworkForPeriod(from, to, +tweetsLimit, +hashtagsMinDegree, +usersMinDegree, +hashtagsLimit, +usersLimit).retrieveData(result => {
                $scope.loading = false;
                if (result.overLimit) {
                  $scope.overLimit = true;
                  $scope.tweetCount = result.tweetCount;
                } else {
                  $scope.overLimit = false;
                  $scope.tweetCount = result.tweetCount;
                  $scope.network = result.network;
                }
                $scope.$apply();
              });
              $scope.$apply();
            }, 0, false);
          }
        }
      },
    }
  })

  .directive('hashtagsByPeriod', function (Facets, $timeout){
    return {
      restrict: 'E',
      scope: {
        from: '=',
        to: '=',
        defaultFrom: '=',
        defaultTo: '=',
        minCount: '=',
        selectedHashtag: '=',
      },
      templateUrl: 'partials/hashtagsByPeriod.html',
      link: function($scope, el, attrs) {
        $scope.loading = true;

        $scope.$watchGroup(['from', 'to', 'defaultFrom', 'defaultTo'], function (newValues, oldValues, $scope) {
          var from = newValues[0];
          var to = newValues[1];
          var defaultFrom = newValues[2];
          var defaultTo = newValues[3];
          if (from && to && from != to) {
            displayFacet(from, to);
          } else if (defaultFrom && defaultTo) {
            displayFacet(defaultFrom, defaultTo);
          }
        })
        $scope.selectItem = function(hashtag) {
          $scope.selectedHashtag = hashtag;
        }

        function displayFacet(from, to) {
          if (from && to){
            $scope.loading = true;
            $timeout(() => {
              Facets.getHashtagListForPeriod(from, to).retrieveData(data => {
                $scope.loading = false;
                $scope.list = data.filter(d => {
                  return d.tweetCount >= $scope.minCount;
                });
                $scope.$apply();
              });
              $scope.$apply();
            }, 0, false);
          }
        }
      },
    }
  })

  .directive('arianeLine', function(){
    return {
      restrict: 'A',
      scope: {
        text: '@',
        hideLine: '='
      },
      templateUrl: 'partials/arianeLine.html',
    }
  })

  .directive('arianeSpot', function(){
    return {
      restrict: 'A',
      scope: {
        text: '@',
        icon: '@',
      },
      templateUrl: 'partials/arianeSpot.html',
    }
  })

  .directive('tweetVerbatims', function (Facets, $timeout){
    return {
      restrict: 'E',
      scope: {
        from: '=',
        to: '=',
        defaultFrom: '=',
        defaultTo: '=',
        search: '=',
        display: '=',
      },
      templateUrl: 'partials/tweetVerbatims.html',
      link: function($scope, el, attrs) {
        $scope.loading = true;

        $scope.$watchGroup(['from', 'to', 'defaultFrom', 'defaultTo', 'search', 'display'], function (newValues, oldValues, $scope) {
          var from = newValues[0];
          var to = newValues[1];
          var defaultFrom = newValues[2];
          var defaultTo = newValues[3];
          var search = newValues[4];
          var display = newValues[5];
          if (from && to && from != to) {
            displayFacet(from, to, search, display);
          } else if (defaultFrom && defaultTo) {
            displayFacet(defaultFrom, defaultTo, search, display);
          }
        })

        function displayFacet(from, to, search, display) {
          if (display) {
            if (from && to){
              $scope.loading = true;
              $timeout(() => {
                Facets.getTweetsByFilter(from, to, search).retrieveData(data => {
                  $scope.loading = false;
                  $scope.list = data;
                  $scope.$apply();
                });
                $scope.$apply();
              }, 0, false);
            }
          } else {
            $scope.list = []
          }
        }
      },
    }
  })

  .directive('spinner', function (colors){
    return {
      restrict: 'E'
    , templateUrl: 'partials/spinner.html'
    , scope: {
        text: '='
      }
    , link: function(scope, el, attrs) {
        scope.colors = colors

        particlesJS("particles-js", {
          "particles": {
            "number": {
              "value": 80,
              "density": {
                "enable": true,
                "value_area": 250
              }
            },
            "color": {
              "value": "#ffffff"
            },
            "shape": {
              "type": "circle",
              "stroke": {
                "width": 0,
                "color": "#FFFFFF"
              },
              "polygon": {
                "nb_sides": 5
              }
            },
            "opacity": {
              "value": 0.5,
              "random": false,
              "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
              }
            },
            "size": {
              "value": 3,
              "random": true,
              "anim": {
                "enable": false,
                "speed": 40,
                "size_min": 0.2,
                "sync": false
              }
            },
            "line_linked": {
              "enable": true,
              "distance": 150,
              "color": "#ffffff",
              "opacity": 0.4,
              "width": 1
            },
            "move": {
              "enable": true,
              "speed": 8,
              "direction": "none",
              "random": false,
              "straight": false,
              "out_mode": "out",
              "bounce": false,
              "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
              }
            }
          },
          "interactivity": {
            "detect_on": "canvas",
            "events": {
              "onhover": {
                "enable": true,
                "mode": "grab"
              },
              "onclick": {
                "enable": true,
                "mode": "push"
              },
              "resize": true
            },
            "modes": {
              "grab": {
                "distance": 140,
                "line_linked": {
                  "opacity": 1
                }
              },
              "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
              },
              "repulse": {
                "distance": 200,
                "duration": 0.4
              },
              "push": {
                "particles_nb": 4
              },
              "remove": {
                "particles_nb": 2
              }
            }
          },
          "retina_detect": true
        });

      }
    }
  })