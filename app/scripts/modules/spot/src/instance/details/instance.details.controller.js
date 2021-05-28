'use strict';

import UIROUTER_ANGULARJS from '@uirouter/angularjs';
import { module } from 'angular';
import ANGULAR_UI_BOOTSTRAP from 'angular-ui-bootstrap';
import _ from 'lodash';

import { ServerGroupReader, InstanceReader, RecentHistoryService } from '@spinnaker/core';

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
    function($scope, $state, instance, app, moniker, environment, $q) {
      //    debugger;
      $scope.application = app;
      $scope.moniker = moniker;
      $scope.environment = environment;
      $scope.account = instance.account;

      const initialize = app.isStandalone
        ? retrieveInstance()
        : $q.all([app.serverGroups.ready()]).then(retrieveInstance);

      initialize.then(() => {
        if (!$scope.$$destroyed && !app.isStandalone) {
          app.serverGroups.onRefresh($scope, retrieveInstance);
        }
      });


      function retrieveInstance() {
        let instanceSummary, account, region, serverGroupOfInstance = '';
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
                serverGroupOfInstance = serverGroup.name;
                return true;
              }
            });
          });
        }

        if (instanceSummary && account && region && serverGroupOfInstance) {
          instanceSummary.account = account;
          return ServerGroupReader.getServerGroup(
            app.name,
            account,
            region,
            serverGroupOfInstance,
          ).then((details) => {
            const serverGroupInstances = details.elastigroupActiveInstances;
            const instanceDetails = serverGroupInstances.find(serverGroupInstance => serverGroupInstance.instanceId === instance.instanceId);
            let date = new Date(instanceDetails.createdAt);

            instanceSummary.launchTime = date.toLocaleString();
            instanceSummary.instanceType = instanceDetails.instanceType;
            instanceSummary.publicIp = instanceDetails.publicIp;
            instanceSummary.privateIp = instanceDetails.privateIp;
            instanceSummary.status = instanceDetails.status;
            instanceSummary.lifeCycle = instanceDetails.lifeCycle;
            $scope.instance = instanceSummary;
          });
          // return InstanceReader.getInstanceDetails(account, region, instance.instanceId).then((details) => {
          //   if ($scope.$$destroyed) {
          //     return;
          //   }
          //   $scope.state.loading = false;
          //   $scope.instance = _.defaults(details, instanceSummary);
          //   $scope.instance.account = account;
          //   $scope.instance.region = region;
          //   //$scope.baseIpAddress = details.publicDnsName || details.privateIpAddress;
          // }, autoClose);

        }
      }

      // function autoClose() {
      //   if ($scope.$$destroyed) {
      //     return;
      //   }
      //   if (app.isStandalone) {
      //     $scope.state.loading = false;
      //     $scope.instanceIdNotFound = instance.instanceId;
      //     $scope.state.notFoundStandalone = true;
      //     RecentHistoryService.removeLastItem('instances');
      //   } else {
      //     $state.go('^', { allowModalToStayOpen: true }, { location: 'replace' });
      //   }
      // }
    },
  ],
);
