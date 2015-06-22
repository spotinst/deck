'use strict';

let angular = require('angular');

module.exports = angular.module('spinnaker.healthCounts.directive', [
])
  .directive('healthCounts', function ($templateCache) {
    return {
      template: require('./healthCounts.html'),
      restrict: 'E',
      scope: {
        container: '='
      },
      link: function(scope) {


        //BEN_TODO: intersection of this and webpack
        var template = require('./healthLegend.html');
        scope.legend = template;

        function calculateHealthPercent() {
          var container = scope.container,
            up = container.upCount || 0,
            down = container.downCount || 0,
            unknown = container.unknownCount || 0,
            total = up + down + unknown,
            healthPercent = total ? parseInt(up*100/total) : 'n/a';

          scope.healthPercent = healthPercent;
          scope.healthPercentLabel = total ? '%' : '';
          scope.healthStatus = healthPercent === 100 ? 'healthy'
            : healthPercent < 100 && healthPercent > 0 ? 'unhealthy'
            : healthPercent === 0 ? 'dead' : 'disabled';

        }

        scope.$watch('container', calculateHealthPercent);
      }
    };
  }
);
