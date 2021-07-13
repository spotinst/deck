'use strict';

import { module } from 'angular';

import { TaskExecutor, TaskMonitor } from '@spinnaker/core';

export const SPOT_SERVERGROUP_CONFIGURE_WIZARD_CREATESERVERGROUP_SPOT_CONTROLLER =
  'spinnaker.serverGroup.configure.spot.createServerGroup';
export const name = SPOT_SERVERGROUP_CONFIGURE_WIZARD_CREATESERVERGROUP_SPOT_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_CONFIGURE_WIZARD_CREATESERVERGROUP_SPOT_CONTROLLER, []).controller(
  'spotCreateServerGroupCtrl',
  [
    '$scope',
    '$uibModalInstance',
    'serverGroupWriter',
    'serverGroupCommand',
    'application',
    function ($scope, $uibModalInstance, serverGroupWriter, serverGroupCommand, application) {
      $scope.pages = {
        jsonSettings: require('./jsonSettings.html'),
      };

      $scope.userInput = {
        serverGroupConfig: '',
        selectedAccount: '',
      };

      function onTaskComplete() {
        application.serverGroups.refresh();
      }

      $scope.taskMonitor = new TaskMonitor({
        application: application,
        title: 'Creating your server group',
        modalInstance: $uibModalInstance,
        onTaskComplete: onTaskComplete,
      });

      this.submit = function () {
        $scope.taskMonitor.submit(function () {
          const params = { cloudProvider: 'spot' };
          params.type = 'deployElastigroup';
          params.credentials = application.defaultCredentials.spot;
          params.payload = $scope.userInput.serverGroupConfig;

          return TaskExecutor.executeTask({
            job: [params],
            application,
            description: 'Creating new server group',
          });
        });
      };

      this.cancel = function () {
        $uibModalInstance.dismiss();
      };
    },
  ],
);
