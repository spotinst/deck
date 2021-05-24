'use strict';

import { module } from 'angular';
import { ScalingPolicyWriter } from './ScalingPolicyWriter';
import { buildUpdateElastigroupCommand } from '../helpers/serverGroupHelper';
import {
  ConfirmationModalService,
  ServerGroupReader,
  ServerGroupWarningMessageService,
  SERVER_GROUP_WRITER,
  TaskMonitor,
} from '@spinnaker/core';
import UIROUTER_ANGULARJS from '@uirouter/angularjs';
import {
  SCALING_ACTIONS_OPTIONS,
  SCALING_POLICIES_KINDS,
} from 'root/app/scripts/modules/spot/src/serverGroup/details/scalingPolicy/constants';
import { cloneDeep } from 'lodash';

export const SPOT_SERVERGROUP_DETAILS_SERVERGROUPDETAILS_CONTROLLER = 'spinnaker.spot.serverGroup.details.controller';
export const name = SPOT_SERVERGROUP_DETAILS_SERVERGROUPDETAILS_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_SERVERGROUPDETAILS_CONTROLLER, [UIROUTER_ANGULARJS, SERVER_GROUP_WRITER]).controller(
  'spotServerGroupDetailsCtrl',
  [
    '$scope',
    '$state',
    '$uibModal',
    'app',
    'serverGroup',
    'serverGroupWriter',
    function($scope, $state, $uibModal, app, serverGroup, serverGroupWriter) {
      const provider = 'spot';
      this.application = app;
      this.serverGroup = serverGroup;

      this.state = {
        loading: true,
      };

      /////////////////////////////////////////////////////////
      // Fetch data
      /////////////////////////////////////////////////////////

      const retrieveServerGroup = () => {
        return ServerGroupReader.getServerGroup(
          app.name,
          serverGroup.accountId,
          serverGroup.region,
          serverGroup.name,
        ).then(details => {
          cancelLoader();
          details.account = serverGroup.accountId;
          this.serverGroup = details;
          this.elastigroupId = this.serverGroup.elastigroup.id;
        });
      };
      /////////////////////////////////////////////////////////
      // scaling policy
      /////////////////////////////////////////////////////////
      this.openCreateScalingPolicyModal = () => {
        $uibModal.open({
          templateUrl: require('./scalingPolicy/scalingPolicyCreation.html'),
          controller: 'spotScalingPolicyCreationCtrl as ctrl',
          resolve: {
            serverGroup: () => this.serverGroup,
            application: () => app,
          },
        });
      };

      //we add index and kind to the scaling policies
      this.getScalingUpPolicies = () => {
        const retVal = [];
        const scaleUpPolicies = this.serverGroup.elastigroup.scaling.up;

        if (scaleUpPolicies) {
          for (let index = 0; index < scaleUpPolicies.length; index++) {
            scaleUpPolicies[index].index = index;
            scaleUpPolicies[index].kind = SCALING_POLICIES_KINDS.UP;
            retVal.push(scaleUpPolicies[index]);
          }
        }

        return retVal;
      };

      this.getScalingDownPolicies = () => {
        const retVal = [];
        const scaleDownPolicies = this.serverGroup.elastigroup.scaling.down;

        if (scaleDownPolicies) {
          for (let index = 0; index < scaleDownPolicies.length; index++) {
            scaleDownPolicies[index].index = index;
            scaleDownPolicies[index].kind = SCALING_POLICIES_KINDS.DOWN;
            retVal.push(scaleDownPolicies[index]);
          }
        }

        return retVal;
      };

      this.getScalingTargetPolicies = () => {
        const retVal = [];
        const scaleTargetPolicies = this.serverGroup.elastigroup.scaling.target;

        if (scaleTargetPolicies) {
          for (let index = 0; index < scaleTargetPolicies.length; index++) {
            scaleTargetPolicies[index].index = index;
            scaleTargetPolicies[index].kind = SCALING_POLICIES_KINDS.TARGET;
            retVal.push(scaleTargetPolicies[index]);
          }
        }

        return retVal;
      };

      this.editSimpleScalingPolicy = policy => {
        //open the new modal of simple scaling policy with action edit
        $uibModal.open({
          templateUrl: require('./scalingPolicy/simpleScalingPolicy/simpleScalingPolicy.html'),
          controller: 'spotSimpleScalingPolicyCtrl as ctrl',
          resolve: {
            serverGroup: () => this.serverGroup,
            action: () => 'Edit',
            application: () => app,
            policy: () => policy,
          },
        });
      };

      this.editTargetScalingPolicy = policy => {
        //open the new modal of simple scaling policy with action edit
        $uibModal.open({
          templateUrl: require('./scalingPolicy/targetScalingPolicy/targetScalingPolicy.html'),
          controller: 'spotTargetScalingPolicyCtrl as ctrl',
          resolve: {
            serverGroup: () => this.serverGroup,
            action: () => 'Edit',
            application: () => app,
            policy: () => policy,
          },
        });
      };

      this.deleteSpotScalingPolicy = policy => {
        const serverGroup = cloneDeep(this.serverGroup);
        const kindOfPolicyToDelete = policy.kind;
        const policyNameToDelete = policy.policyName;
        const policyIndex = policy.index;
        const allScalingPolicies = serverGroup.elastigroup.scaling;

        const taskMonitor = {
          application: app,
          title:
            'Delete ' + kindOfPolicyToDelete + ' scaling policy: ' + policyNameToDelete + ' from ' + serverGroup.name,
        };
        const policyConfigForSdk = buildPolicyConfigForApi(allScalingPolicies, kindOfPolicyToDelete, policyIndex);
        const command = buildUpdateElastigroupCommand(policyConfigForSdk, serverGroup);
        const submitMethod = function() {
          return ScalingPolicyWriter.deleteScalingPolicy(app, command);
        };
        ConfirmationModalService.confirm({
          header: 'Are you sure you wish to delete this policy?',
          buttonText: 'Delete',
          verificationLabel: `<p align="right"><strong>Please type in the scaling policy name
          (<span class="verification-text">${policyNameToDelete}</span>) to confirm.</strong></p>`,
          textToVerify: `${policyNameToDelete}`,
          taskMonitorConfig: taskMonitor,
          submitMethod,
        });
      };

      function buildPolicyConfigForApi(allScalingPolicies, kindOfPolicyToDelete, policyIndex) {
        let retVal;

        let allScaleUpPolicies = allScalingPolicies.up;
        let allScaleDownPolicies = allScalingPolicies.down;
        let allScaleTargetPolicies = allScalingPolicies.target;

        //normalize the type field
        if (allScaleUpPolicies) {
          allScaleUpPolicies.forEach(
            scaleUp =>
              (scaleUp.action.type = SCALING_ACTIONS_OPTIONS.find(
                act => act.typeUpperCase === scaleUp.action.type || act.type === scaleUp.action.type,
              ).type),
          );
        }
        if (allScaleDownPolicies) {
          allScaleDownPolicies.forEach(
            scaleDown =>
              (scaleDown.action.type = SCALING_ACTIONS_OPTIONS.find(
                act => act.typeUpperCase === scaleDown.action.type || act.type === scaleDown.action.type,
              ).type),
          );
        }

        switch (kindOfPolicyToDelete) {
          case SCALING_POLICIES_KINDS.UP: {
            allScaleUpPolicies.splice(policyIndex, 1);
            break;
          }
          case SCALING_POLICIES_KINDS.DOWN: {
            allScaleDownPolicies.splice(policyIndex, 1);
            break;
          }
          case SCALING_POLICIES_KINDS.TARGET: {
            allScaleTargetPolicies.splice(policyIndex, 1);
            break;
          }
        }
        allScalingPolicies.up = allScaleUpPolicies;
        allScalingPolicies.down = allScaleDownPolicies;
        allScalingPolicies.target = allScaleTargetPolicies;

        retVal = { group: { scaling: allScalingPolicies } };

        return retVal;
      }

      ////////////////////////////////////////////////////////////
      // Actions. Triggered by server group details dropdown menu
      ////////////////////////////////////////////////////////////
      this.resizeServerGroup = () => {
        $uibModal.open({
          templateUrl: require('./resize/resizeServerGroup.html'),
          controller: 'spotResizeServerGroupCtrl as ctrl',
          resolve: {
            serverGroup: () => this.serverGroup,
            application: () => app,
          },
        });
      };

      this.destroyServerGroup = () => {
        const serverGroup = this.serverGroup;

        const taskMonitor = {
          application: app,
          title: 'Destroying ' + serverGroup.name,
          onTaskComplete: () => {
            if ($state.includes('**.serverGroup', stateParams)) {
              $state.go('^');
            }
          },
        };

        const submitMethod = params =>
          serverGroupWriter.destroyServerGroup(serverGroup, app, { elastigroupId: serverGroup.elastigroup.id });

        const stateParams = {
          name: serverGroup.name,
          accountId: serverGroup.account,
          region: serverGroup.region,
        };

        const confirmationModalParams = {
          header: 'Really destroy ' + serverGroup.name + '?',
          buttonText: 'Destroy ' + serverGroup.name,
          account: serverGroup.account,
          taskMonitorConfig: taskMonitor,
          submitMethod: submitMethod,
          askForReason: true,
          platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
          platformHealthType: 'Spot',
        };

        ServerGroupWarningMessageService.addDestroyWarningMessage(app, serverGroup, confirmationModalParams);

        if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
          confirmationModalParams.interestingHealthProviderNames = ['Spot'];
        }

        ConfirmationModalService.confirm(confirmationModalParams);
      };

      //      this.cloneServerGroup = serverGroup => {
      //        $uibModal.open({
      //          templateUrl: require('../configure/wizard/serverGroupWizard.html'),
      //          controller: 'spotCloneServerGroupCtrl as ctrl',
      //          size: 'lg',
      //          resolve: {
      //            title: () => 'Clone ' + serverGroup.name,
      //            application: () => app,
      //            serverGroupCommand: () =>
      //                     spotServerGroupCommandBuilder.buildServerGroupCommandFromExisting(app, serverGroup),
      //          },
      //        });
      //      };

      this.disableServerGroup = () => {
        const serverGroup = this.serverGroup;

        const taskMonitor = {
          application: app,
          title: 'Disabling ' + serverGroup.name,
        };

        const submitMethod = params =>
          serverGroupWriter.disableServerGroup(serverGroup, app, { elastigroupId: serverGroup.elastigroup.id });

        const confirmationModalParams = {
          header: 'Really disable ' + serverGroup.name + '?',
          buttonText: 'Disable ' + serverGroup.name,
          account: serverGroup.account,
          taskMonitorConfig: taskMonitor,
          platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
          platformHealthType: 'Spot',
          submitMethod: submitMethod,
          askForReason: true,
        };

        ServerGroupWarningMessageService.addDisableWarningMessage(app, serverGroup, confirmationModalParams);

        if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
          confirmationModalParams.interestingHealthProviderNames = ['Spot'];
        }

        ConfirmationModalService.confirm(confirmationModalParams);
      };

      this.enableServerGroup = () => {
        const serverGroup = this.serverGroup;

        const taskMonitor = {
          application: app,
          title: 'Enabling ' + serverGroup.name,
        };

        const submitMethod = params =>
          serverGroupWriter.enableServerGroup(serverGroup, app, { elastigroupId: serverGroup.elastigroup.id });

        const confirmationModalParams = {
          header: 'Really enable ' + serverGroup.name + '?',
          buttonText: 'Enable ' + serverGroup.name,
          account: serverGroup.account,
          taskMonitorConfig: taskMonitor,
          platformHealthOnlyShowOverride: app.attributes.platformHealthOnlyShowOverride,
          platformHealthType: 'Spot',
          submitMethod: submitMethod,
          askForReason: true,
        };

        if (app.attributes.platformHealthOnlyShowOverride && app.attributes.platformHealthOnly) {
          confirmationModalParams.interestingHealthProviderNames = ['Spot'];
        }

        ConfirmationModalService.confirm(confirmationModalParams);
      };

      const cancelLoader = () => {
        this.state.loading = false;
      };

      retrieveServerGroup().then(() => {
        if (!$scope.$$destroyed) {
          app.serverGroups.onRefresh($scope, retrieveServerGroup);
        }
      });
    },
  ],
);
