'use strict';

/* Services */

angular.module('thisApp.directives', [])
  
  .directive('navbar', [function(){
    return {
      restrict: 'E'
    , templateUrl: 'partials/navbar.html'
    }
  }])

  .directive('ngPressEnter', [function () {
    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$eval(attrs.ngPressEnter)
          event.preventDefault()
          scope.$apply()
        }
      })
    }
  }])


  .directive('dailyCount', [function (){
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
        let elId = el.attr('id')
        if (!elId) {console.log('Element id missing -> causes issues')};

        el.html('<div class="simple-curve">Loading...</div>');

        $scope.$watch('data', () => {
          if ($scope.data !== undefined){
            let data = $scope.data;
            let getTime = $scope.timeAccessor;
            let getVolume = $scope.volumeAccessor;
            $(`#${elId} .simple-curve`).html('');

            var margin = {top: 10, right: 10, bottom: 30, left: 40},
                width = 960 - margin.left - margin.right,
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
                .style('fill', 'steelblue')
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
              let from = newValues[0];
              let to = newValues[1];
              if (from && to) {
                let extent = [new Date(from), new Date(to)];
                updateBrush(extent);
              }
            })

            function updateBrush(extent) {
              x.domain(extent);
              focus.select(".area").attr("d", area);
              focus.select(".x.axis").call(xAxis);
            }
          }
        });
      },
    }
  }])

  .directive('dailyCountBrushable', [function (){
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
        let elId = el.attr('id')
        if (!elId) {console.log('Element id missing -> causes issues')};

        el.html('<div class="brush-curve">Loading...</div>');

        $scope.$watch('data', () => {
          if ($scope.data !== undefined){
            let data = $scope.data;
            let getTime = $scope.timeAccessor;
            let getVolume = $scope.volumeAccessor;
            $(`#${elId} .brush-curve`).html('');

            var margin = {top: 10, right: 10, bottom: 20, left: 40},
                width = 960 - margin.left - margin.right,
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
                .style('fill', 'steelblue')
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
              let from = newValues[0];
              let to = newValues[1];
              if (from && to) {
                let extent = [new Date(from), new Date(to)];
                brush.extent(extent);
                svg.select(".brush").call(brush);
              }
            })

            function brushed() {
              let extent = brush.extent();
              $scope.from = extent[0].getTime();
              $scope.to = extent[1].getTime();
              $scope.$apply();
            }

            function brushEnded() {
              $scope.$emit('brushEnded');
              $scope.$apply();
            }
          }
        });
      },
    }
  }])

  .directive('hashtagsByPeriod', ['Facets', '$timeout', function (Facets, $timeout){
    return {
      restrict: 'E',
      scope: {
        from: '=',
        to: '=',
        defaultFrom: '=',
        defaultTo: '=',
        minCount: '=',
      },
      templateUrl: 'partials/hashtagsByPeriod.html',
      link: function($scope, el, attrs) {
        $scope.loading = true;
        $scope.$watchGroup(['from', 'to', 'defaultFrom', 'defaultTo'], function (newValues, oldValues, $scope) {
          let from = newValues[0];
          let to = newValues[1];
          let defaultFrom = newValues[2];
          let defaultTo = newValues[3];
          if (from && to && from != to) {
            displayFacet(from, to);
          } else if (defaultFrom && defaultTo) {
            displayFacet(defaultFrom, defaultTo);
          }
        })

        function displayFacet(from, to) {
          if (from && to){
            $scope.loading = true;
            $timeout(() => {
              Facets.getHashtagListForPeriod(from, to).retrieveData(data => {
                $scope.loading = false;
                $scope.list = data.filter(d => {
                  return d.tweetCount >= $scope.minCount;
                }).sort(function (a, b){
                  return b.tweetCount - a.tweetCount;
                });
                $scope.$apply();
              });
              $scope.$apply();
            }, 0, false);
          }
        }
      },
    }
  }])

  .directive('spinner', [function (){
    return {
      restrict: 'E'
    , templateUrl: 'partials/spinner.html'
    , scope: {
        text: '='
      }
    , link: function(scope, el, attrs) {

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
  }])