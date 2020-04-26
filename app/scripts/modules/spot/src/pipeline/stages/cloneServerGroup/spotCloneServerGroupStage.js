'use strict';

import { module } from 'angular';
import _ from 'lodash';

import { AccountService, AppListExtractor, NameUtils, Registry, StageConstants } from '@spinnaker/core';

export const SPOT_PIPELINE_STAGES_CLONESERVERGROUP_SPOTCLONESERVERGROUPSTAGE =
  'spinnaker.spot.pipeline.stage.cloneServerGroupStage';
export const name = SPOT_PIPELINE_STAGES_CLONESERVERGROUP_SPOTCLONESERVERGROUPSTAGE; // for backwards compatibility
module(SPOT_PIPELINE_STAGES_CLONESERVERGROUP_SPOTCLONESERVERGROUPSTAGE, [])
  .config(function() {
    Registry.pipeline.registerStage({
      provides: 'cloneServerGroup',
      cloudProvider: 'spot',
      templateUrl: require('./cloneServerGroupStage.html'),
      executionStepLabelUrl: require('./cloneServerGroupStepLabel.html'),
      accountExtractor: stage => [stage.context.credentials],
      validators: [
        { type: 'requiredField', fieldName: 'targetCluster', fieldLabel: 'cluster' },
        { type: 'requiredField', fieldName: 'target' },
        { type: 'requiredField', fieldName: 'credentials', fieldLabel: 'account' },
      ],
    });
  })
  .controller('spotCloneServerGroupStageCtrl', [
    '$scope',
    function($scope) {
      const stage = $scope.stage;

      $scope.viewState = {
        accountsLoaded: false,
      };

      AccountService.listAccounts('spot').then(accounts => {
        $scope.accounts = accounts;
        $scope.viewState.accountsLoaded = true;
      });

      this.cloneTargets = StageConstants.TARGET_LIST;
      stage.target = stage.target || this.cloneTargets[0].val;
      stage.application = $scope.application.name;
      stage.cloudProvider = 'spot';
      stage.cloudProviderType = 'spot';

      if (!stage.credentials && $scope.application.defaultCredentials.spot) {
        stage.credentials = $scope.application.defaultCredentials.spot;
      }

      this.targetClusterUpdated = () => {
        if (stage.targetCluster) {
          const filterByCluster = AppListExtractor.monikerClusterNameFilter(stage.targetCluster);
          const moniker = _.first(AppListExtractor.getMonikers([$scope.application], filterByCluster));
          if (moniker) {
            stage.stack = moniker.stack;
            stage.freeFormDetails = moniker.detail;
          } else {
            // if the user has entered a free-form value for the target cluster, fall back to the naming service
            const nameParts = NameUtils.parseClusterName(stage.targetCluster);
            stage.stack = nameParts.stack;
            stage.freeFormDetails = nameParts.freeFormDetails;
          }
        } else {
          stage.stack = '';
          stage.freeFormDetails = '';
        }
      };

      $scope.$watch('stage.targetCluster', this.targetClusterUpdated);

      this.removeCapacity = () => {
        delete stage.capacity;
      };

      if (!_.has(stage, 'useSourceCapacity')) {
        stage.useSourceCapacity = true;
      }

      this.toggleSuspendedProcess = process => {
        stage.suspendedProcesses = stage.suspendedProcesses || [];
        const processIndex = stage.suspendedProcesses.indexOf(process);
        if (processIndex === -1) {
          stage.suspendedProcesses.push(process);
        } else {
          stage.suspendedProcesses.splice(processIndex, 1);
        }
      };

      this.processIsSuspended = process => {
        return stage.suspendedProcesses && stage.suspendedProcesses.includes(process);
      };
    },
  ]);
