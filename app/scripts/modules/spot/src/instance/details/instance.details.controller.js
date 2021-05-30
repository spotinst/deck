'use strict';

import UIROUTER_ANGULARJS from '@uirouter/angularjs';
import { module } from 'angular';
import ANGULAR_UI_BOOTSTRAP from 'angular-ui-bootstrap';

import { ConfirmationModalService, InstanceWriter, InstanceReader } from '@spinnaker/core';
import _, { capitalize } from 'lodash';

export const SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER = 'spinnaker.spot.instance.details.controller';
export const name = SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER; // for backwards compatibility
module(SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER, [UIROUTER_ANGULARJS, ANGULAR_UI_BOOTSTRAP]  ).controller(
  'spotInstanceDetailsCtrl',
  [
    '$scope',
    '$state',
    '$q',
    'app',
    'instance',
    function($scope, $state, $q, app, instance) {
      $scope.application = app;

      const initialize = app.isStandalone
        ? retrieveInstance()
        : $q.all([app.serverGroups.ready()]).then(retrieveInstance);

      initialize.then(() => {
        if (!$scope.$$destroyed && !app.isStandalone) {
          app.serverGroups.onRefresh($scope, retrieveInstance);
        }
      });

      const lifeCycleDict = {
        SPOT: { label: 'Spot'},
        OD: { label: 'OD'},
      };

      function retrieveInstance() {
        let instanceSummary, account, region;
        if (!$scope.application.serverGroups) {
          instanceSummary = {};
          account = instance.account;
          region = instance.region;
        } else {
          $scope.application.serverGroups.data.some(serverGroup => {
            return serverGroup.instances.some(possibleInstance => {
              if (possibleInstance.id === instance.instanceId || possibleInstance.name === instance.instanceId) {
                instanceSummary = possibleInstance;
                account = serverGroup.account;
                region = serverGroup.region;
                return true;
              }
            });
          });
        }

        instanceSummary.account = account;
        instanceSummary.region = region;
        instanceSummary.instanceId = instance.instanceId;
        if (instanceSummary && account && region) {
          return InstanceReader.getInstanceDetails(account, region, instance.instanceId).then(details => {
            $scope.instance = _.defaults(instanceSummary, details);
            $scope.instance.serverGroupId = details.serverGroup;
            const date = new Date(details.launchTime);

            $scope.instance.launchTime = date.toLocaleString();
            $scope.instance.type = $scope.instance.type.toLowerCase().replace('_','.');
            const healthStatusLowerCase = details.spotHealthStatus.toLowerCase();
            $scope.instance.lifecycle = lifeCycleDict[$scope.instance.lifecycle].label;
            $scope.instance.spotHealthStatus = capitalize(healthStatusLowerCase);
          });
        }
      }

      this.terminateInstance = function terminateInstance() {
        const instance = $scope.instance;

        const taskMonitor = {
          application: app,
          title: 'Terminating ' + instance.instanceId,
          onTaskComplete: function() {
            if ($state.includes('**.instanceDetails', { instanceId: instance.instanceId })) {
              $state.go('^');
            }
          },
        };

        const submitMethod = function() {
          const params = { cloudProvider: 'spot' };

          params.elastiGroup = instance.serverGroupId;

          return InstanceWriter.terminateInstance(instance, app, params);
        };

        ConfirmationModalService.confirm({
          header: 'Really terminate ' + instance.instanceId + '?',
          buttonText: 'Terminate ' + instance.instanceId,
          account: instance.account,
          taskMonitorConfig: taskMonitor,
          submitMethod: submitMethod,
        });
      };

      this.terminateInstanceAndShrinkServerGroup = function terminateInstanceAndShrinkServerGroup() {
        const instance = $scope.instance;

        const taskMonitor = {
          application: app,
          title: 'Terminating ' + instance.instanceId + ' and shrinking server group',
          onTaskComplete: function() {
            if ($state.includes('**.instanceDetails', { instanceId: instance.instanceId })) {
              $state.go('^');
            }
          },
        };

        const submitMethod = function() {
          const params = { cloudProvider: 'spot' };
          params.elastiGroup = instance.serverGroupId;
          params.instanceIds = [instance.id];

          return InstanceWriter.terminateInstanceAndShrinkServerGroup(instance, app, params);
        };

        ConfirmationModalService.confirm({
          header: 'Really terminate ' + instance.instanceId + ' and shrink ' + instance.serverGroup + '?',
          buttonText: 'Terminate ' + instance.instanceId + ' and shrink ' + instance.serverGroup,
          account: instance.account,
          taskMonitorConfig: taskMonitor,
          submitMethod: submitMethod,
        });
      };
    },
  ],
);
