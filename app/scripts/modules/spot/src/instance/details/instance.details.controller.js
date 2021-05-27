'use strict';

import UIROUTER_ANGULARJS from '@uirouter/angularjs';
import { module } from 'angular';
import ANGULAR_UI_BOOTSTRAP from 'angular-ui-bootstrap';
import _ from 'lodash';

import { InstanceReader, RecentHistoryService } from '@spinnaker/core';

export const SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER = 'spinnaker.spot.instance.details.controller';
export const name = SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER; // for backwards compatibility
module(SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER, [UIROUTER_ANGULARJS, ANGULAR_UI_BOOTSTRAP]).controller(
  'spotInstanceDetailsCtrl',
  [
    '$scope',
    '$state',
    'instance',
    'app',
    'moniker',
    'environment',
    '$q',
    function ($scope, $state, instance, app, moniker, environment, $q) {
      //    debugger;
      $scope.application = app;
      $scope.moniker = moniker;
      $scope.environment = environment;

      function retrieveInstance() {
        const extraData = {};
        let instanceSummary, account, region;
        if (!$scope.application.serverGroups) {
          // standalone instance
          instanceSummary = { id: instance.instanceId }; // terminate call expects `id` to be populated
          account = instance.account;
          region = instance.region;
        } else {
          $scope.application.serverGroups.data.some((serverGroup) => {
            return serverGroup.instances.some((possibleInstance) => {
              if (possibleInstance.id === instance.instanceId || possibleInstance.name === instance.instanceId) {
                instanceSummary = possibleInstance;
                account = serverGroup.account;
                region = serverGroup.region;
                return true;
              }
            });
          });
        }

        if (instanceSummary && account && region) {
          //        debugger;
          instanceSummary.account = account;
          return InstanceReader.getInstanceDetails(account, region, instance.instanceId).then((details) => {
            if ($scope.$$destroyed) {
              return;
            }
            $scope.state.loading = false;
            $scope.instance = _.defaults(details, instanceSummary);
            $scope.instance.account = account;
            $scope.instance.region = region;
            //          debugger;
            $scope.baseIpAddress = details.publicDnsName || details.privateIpAddress;
          }, autoClose);
        }
      }

      function autoClose() {
        if ($scope.$$destroyed) {
          return;
        }
        if (app.isStandalone) {
          $scope.state.loading = false;
          $scope.instanceIdNotFound = instance.instanceId;
          $scope.state.notFoundStandalone = true;
          RecentHistoryService.removeLastItem('instances');
        } else {
          $state.go('^', { allowModalToStayOpen: true }, { location: 'replace' });
        }
      }

      const initialize = app.isStandalone
        ? retrieveInstance()
        : $q.all([app.serverGroups.ready()]).then(retrieveInstance);

      initialize.then(() => {
        if (!$scope.$$destroyed && !app.isStandalone) {
          app.serverGroups.onRefresh($scope, retrieveInstance);
        }
      });

      $scope.account = instance.account;
    },
  ],
);
