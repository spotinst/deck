'use strict';
import { module } from 'angular';

import { ServerGroupReader } from '@spinnaker/core';
import moment from 'moment';

export const SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER =
  'spinnaker.spot.serverGroup.details.elastilogs.elastilogs.controller';
export const name = SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER; // for backwards compatibility
export const ALL = 'ALL';
export const INFO = 'INFO';
export const DEBUG = 'DEBUG';
export const WARN = 'WARN';
export const ERROR = 'ERROR';
export const ONE_DAY = 'ONE DAY';
export const TWO_DAYS = 'TWO DAYS';
export const THREE_DAYS = 'THREE DAYS';
export const ONE_WEEK = 'ONE WEEK';
export const TWO_WEEKS = 'TWO WEEKS';
export const ONE_MONTH = 'ONE MONTH';
export const TWO_MONTHS = 'TWO MONTHS';
export const THREE_MONTHS = 'THREE MONTHS';
const mode = module(SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER, []);
mode
  .constant({
    ONE_DAY,
    TWO_DAYS,
    THREE_DAYS,
    ONE_WEEK,
    TWO_WEEKS,
    ONE_MONTH,
    TWO_MONTHS,
    THREE_MONTHS,
  })
  .constant({
    ALL,
    INFO,
    DEBUG,
    WARN,
    ERROR,
  });
mode.controller('spotElastilogsCtrl', [
  '$scope',
  '$uibModalInstance',
  'action',
  'serverGroup',
  'application',
  function($scope, $uibModalInstance, action, serverGroup, application) {
    this.action = action;
    this.serverGroup = serverGroup;
    this.application = application;
    $scope.severity = 'ALL';
    $scope.time = 'ONE_DAY';
    $scope.timeLabel = ONE_DAY;
    const now = moment();
    $scope.toDate = now.format();
    $scope.fromDate = now.add(-1, 'days').format();

    this.close = function() {
      $uibModalInstance.close();
    };

    this.handleElastilogs = function(elastilogs) {
      this.elastilogs = elastilogs;
    };

    this.setElastilogsSeverity = function(severity) {
      $scope.severity = severity;
      this.getElastilogs();
    };

    this.setElastilogsTime = function(time) {
      const now = moment();
      switch (time) {
        case 'ONE_DAY':
          $scope.fromDate = now.add(-1, 'day').format();
          $scope.timeLabel = ONE_DAY;
          break;
        case 'TWO_DAYS':
          $scope.fromDate = now.add(-2, 'days').format();
          $scope.timeLabel = TWO_DAYS;
          break;
        case 'THREE_DAYS':
          $scope.fromDate = now.add(-3, 'days').format();
          $scope.timeLabel = THREE_DAYS;
          break;
        case 'ONE_WEEK':
          $scope.fromDate = now.add(-1, 'week').format();
          $scope.timeLabel = ONE_WEEK;
          break;
        case 'TWO_WEEKS':
          $scope.fromDate = now.add(-2, 'weeks').format();
          $scope.timeLabel = TWO_WEEKS;
          break;
        case 'ONE_MONTH':
          $scope.fromDate = now.add(-1, 'month').format();
          $scope.timeLabel = ONE_MONTH;
          break;
        case 'TWO_MONTHS':
          $scope.fromDate = now.add(-2, 'months').format();
          $scope.timeLabel = TWO_MONTHS;
          break;
        case 'THREE_MONTHS':
          $scope.fromDate = now.add(-3, 'months').format();
          $scope.timeLabel = THREE_MONTHS;
          break;
        default:
          $scope.fromDate = now.add(-1, 'day').format();
          $scope.timeLabel = ONE_DAY;
      }
      $scope.time = time;
      this.getElastilogs();
    };

    this.getElastilogs = function() {
      this.elastilogs = [];
      this.viewState = {
        loading: true,
        error: false,
      };
      ServerGroupReader.getElastilogs(
        this.serverGroup,
        this.serverGroup.elastigroup.id,
        $scope.fromDate,
        $scope.toDate,
        $scope.severity,
      ).then(
        elastilogs => {
          this.viewState.loading = false;
          this.handleElastilogs(elastilogs);
        },
        () => {
          this.viewState.error = true;
        },
      );
    };

    this.getElastilogs();
  },
]);
