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
      templateUrl: 'partials/dailyCount.html',
      scope: {
        data: '=',
        timeAccessor: '=',
        volumeAccessor: '=',
        from: '=',
        to: '=',
      },
      link: function($scope, el, attrs) {
        $scope.$watch('data', () => {
          if ($scope.data !== undefined){
            let data = $scope.data;
            let getTime = $scope.timeAccessor;
            let getVolume = $scope.volumeAccessor;
            $('.brush-curve').html('');

            var margin = {top: 10, right: 10, bottom: 100, left: 40},
                margin2 = {top: 430, right: 10, bottom: 20, left: 40},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom,
                height2 = 500 - margin2.top - margin2.bottom;

            var parseDate = d3.time.format("%b %Y").parse;

            var x = d3.time.scale().range([0, width]),
                x2 = d3.time.scale().range([0, width]),
                y = d3.scale.linear().range([height, 0]),
                y2 = d3.scale.linear().range([height2, 0]);

            var xAxis = d3.svg.axis().scale(x).orient("bottom"),
                xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                yAxis = d3.svg.axis().scale(y).orient("left");

            var brush = d3.svg.brush()
                .x(x2)
                .on("brush", brushed);

            var area = d3.svg.area()
                .interpolate("monotone")
                .x(function(d) { return x(getTime(d)); })
                .y0(height)
                .y1(function(d) { return y(getVolume(d)); });

            var area2 = d3.svg.area()
                .interpolate("monotone")
                .x(function(d) { return x2(getTime(d)); })
                .y0(height2)
                .y1(function(d) { return y2(getVolume(d)); });

            var svg = d3.select(".brush-curve").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
              .append("rect")
                .attr("width", width)
                .attr("height", height);

            var focus = svg.append("g")
                .attr("class", "focus")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var context = svg.append("g")
                .attr("class", "context")
                .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

            x.domain(d3.extent(data.map(getTime)));
            y.domain([0, d3.max(data.map(getVolume))]);
            x2.domain(x.domain());
            y2.domain(y.domain());

            focus.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area);

            focus.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            context.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area2);

            context.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height2 + ")")
                .call(xAxis2);

            context.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -6)
                .attr("height", height2 + 7);

            function brushed() {
              x.domain(brush.empty() ? x2.domain() : brush.extent());
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
      templateUrl: 'partials/dailyCount.html',
      scope: {
        data: '=',
        timeAccessor: '=',
        volumeAccessor: '=',
        from: '=',
        to: '=',
      },
      link: function($scope, el, attrs) {
        $scope.$watch('data', () => {
          if ($scope.data !== undefined){
            let data = $scope.data;
            let getTime = $scope.timeAccessor;
            let getVolume = $scope.volumeAccessor;
            $('.brush-curve').html('');

            var margin = {top: 10, right: 10, bottom: 100, left: 40},
                margin2 = {top: 430, right: 10, bottom: 20, left: 40},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom,
                height2 = 500 - margin2.top - margin2.bottom;

            var parseDate = d3.time.format("%b %Y").parse;

            var x = d3.time.scale().range([0, width]),
                x2 = d3.time.scale().range([0, width]),
                y = d3.scale.linear().range([height, 0]),
                y2 = d3.scale.linear().range([height2, 0]);

            var xAxis = d3.svg.axis().scale(x).orient("bottom"),
                xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                yAxis = d3.svg.axis().scale(y).orient("left");

            var brush = d3.svg.brush()
                .x(x2)
                .on("brush", brushed);

            var area = d3.svg.area()
                .interpolate("monotone")
                .x(function(d) { return x(getTime(d)); })
                .y0(height)
                .y1(function(d) { return y(getVolume(d)); });

            var area2 = d3.svg.area()
                .interpolate("monotone")
                .x(function(d) { return x2(getTime(d)); })
                .y0(height2)
                .y1(function(d) { return y2(getVolume(d)); });

            var svg = d3.select(".brush-curve").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.append("defs").append("clipPath")
                .attr("id", "clip")
              .append("rect")
                .attr("width", width)
                .attr("height", height);

            var focus = svg.append("g")
                .attr("class", "focus")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var context = svg.append("g")
                .attr("class", "context")
                .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

            x.domain(d3.extent(data.map(getTime)));
            y.domain([0, d3.max(data.map(getVolume))]);
            x2.domain(x.domain());
            y2.domain(y.domain());

            focus.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area);

            focus.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            focus.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            context.append("path")
                .datum(data)
                .attr("class", "area")
                .attr("d", area2);

            context.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height2 + ")")
                .call(xAxis2);

            context.append("g")
                .attr("class", "x brush")
                .call(brush)
              .selectAll("rect")
                .attr("y", -6)
                .attr("height", height2 + 7);

            // Listen to angular
            $scope.$watchGroup(['from', 'to'], function(newValues, oldValues, scope) {
              let from = newValues[0];
              let to = newValues[1];
              if (from && to) {
                let extent = [new Date(from), new Date(to)];
                brush.extent(extent);
                updateBrush(extent);
                svg.select(".brush").call(brush);
              }
            })

            function brushed() {
              let extent = brush.extent();
              updateBrush(extent);
              $scope.from = extent[0].getTime();
              $scope.to = extent[1].getTime();
              $scope.$apply();
            }

            function updateBrush(extent) {
              x.domain(brush.empty() ? x2.domain() : extent);
              focus.select(".area").attr("d", area);
              focus.select(".x.axis").call(xAxis);
            }
          }
        });
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