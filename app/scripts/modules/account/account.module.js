'use strict';

let angular = require('angular');

module.exports = angular.module('spinnaker.account', [
  require('restangular'),
  require('../caches/caches.module.js'),
  require('../../settings/settings.js'),
])
.directive('providerToggles', require('./providerToggles.directive.js'))
.directive('ifSingleProvider', require('./ifSingleProvider.directive.js'));
