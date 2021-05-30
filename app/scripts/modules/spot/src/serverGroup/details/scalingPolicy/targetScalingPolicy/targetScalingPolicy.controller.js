'use strict';

import { module } from 'angular';
import { cloneDeep } from 'lodash';

import { SERVER_GROUP_WRITER, TaskMonitor } from '@spinnaker/core';
import { ScalingPolicyWriter } from '../../ScalingPolicyWriter';
import { formToJSON } from '../../../helpers/formJsonHelper';
import { buildUpdateElastigroupCommand } from '../../../helpers/serverGroupHelper';

export const SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER =
  'spinnaker.spot.serverGroup.details.scalingPolicy.targetScalingPolicy.controller';
export const name = SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER, [SERVER_GROUP_WRITER]).controller(
  'spotTargetScalingPolicyCtrl',
  [
    '$scope',
    '$uibModalInstance',
    'action',
    'policy',
    'serverGroup',
    'application',
    function($scope, $uibModalInstance, action, policy, serverGroup, application) {
      this.action = action;
      this.policy = cloneDeep(policy);
      this.serverGroup = cloneDeep(serverGroup);

      const metricDict = {
        CPUUtilization: { unit: 'percent', namespace: 'AWS/EC2' },
        NetworkIn: { unit: 'bytes', namespace: 'AWS/EC2' },
        NetworkOut: { unit: 'bytes', namespace: 'AWS/EC2' },
      };

      $scope.metricNameOptions = [
        {
          label: 'Average CPU Utilization (percentage)',
          value: 'CPUUtilization',
        },
        {
          label: 'Average Network In (bytes)',
          value: 'NetworkIn',
        },
        {
          label: 'Average Network Out (bytes)',
          value: 'NetworkOut',
        },
      ];

      $scope.predictionModeOptions = [
        {
          label: 'Predict and scale',
          value: 'FORECAST_AND_SCALE',
        },
        {
          label: 'Predict only',
          value: 'FORECAST_ONLY',
        },
      ];

      $scope.defaultPolicyName = this.policy && this.policy.policyName ? this.policy.policyName : 'default policy name';
      $scope.defaultMetricName =
        this.policy && this.policy.metricName
          ? $scope.metricNameOptions.find(metric => metric.value === this.policy.metricName)
          : $scope.metricNameOptions[0];
      $scope.defaultTarget = this.policy && this.policy.target ? this.policy.target : 50;
      $scope.defaultCoolDown = this.policy && this.policy.cooldown ? this.policy.cooldown : 300;
      $scope.defaultPrediction = this.policy && this.policy.predictive ? true : false;
      $scope.defaultPredictionMode =
        this.policy && this.policy.predictive && this.policy.predictive.mode
          ? $scope.predictionModeOptions.find(mode => mode.value === this.policy.predictive.mode)
          : $scope.predictionModeOptions[0];

      this.cancel = function() {
        $uibModalInstance.close();
      };

      this.isValid = function() {
        const form = document.getElementsByName('spotTargetScalingPolicyForm')[0];
        const formPolicyConfig = formToJSON(form.elements);

        if (
          formPolicyConfig.policyName &&
          formPolicyConfig.metricName &&
          formPolicyConfig.target &&
          formPolicyConfig.cooldown
        ) {
          return true;
        }

        return false;
      };

      this.isMetricCPUUtilization = function() {
        if ($scope.defaultMetricName.value === 'CPUUtilization') {
          return true;
        }

        return false;
      };

      this.submitTargetScalingPolicy = function() {
        if (!this.isValid()) {
          return;
        }
        const form = document.getElementsByName('spotTargetScalingPolicyForm')[0];
        const formPolicyConfig = formToJSON(form.elements);
        const policyConfigForSdk = buildPolicyConfigForApi(
          formPolicyConfig,
          this.policy,
          this.serverGroup.elastigroup.scaling,
        );
        const command = buildUpdateScalingPolicyCommand(policyConfigForSdk, this.serverGroup);

        $scope.taskMonitor = new TaskMonitor({
          application: application,
          title: action + ' scaling policy in ' + serverGroup.name,
          modalInstance: $uibModalInstance,
        });

        const submitMethod = function() {
          return ScalingPolicyWriter.updateScalingPolicy(application, command);
        };

        $scope.taskMonitor.submit(submitMethod);
      };

      function buildUpdateScalingPolicyCommand(groupJson) {
        return {
          type: 'updateElastigroup',
          cloudProvider: 'spot',
          credentials: serverGroup.account,
          region: serverGroup.region,
          serverGroupName: serverGroup.name,
          elastigroupId: serverGroup.elastigroup.id,
          groupToUpdate: groupJson,
        };
      }

      function buildPolicyConfigForApi(formPolicyConfig, existingPolicy, scalingObjForApi) {
        let retVal;
        const metricFromForm = formPolicyConfig.metricName;

        let isPredictionOnFromForm = false;
        let predictionModeFromForm;
        if (
          formPolicyConfig.hasOwnProperty('predictiveAutoScaling') &&
          formPolicyConfig.predictiveAutoScaling.includes('on')
        ) {
          isPredictionOnFromForm = true;
          predictionModeFromForm = formPolicyConfig.predictionMode;
          delete formPolicyConfig.predictiveAutoScaling;
          delete formPolicyConfig.predictionMode;
        }

        const policyConfig = cloneDeep(formPolicyConfig);

        policyConfig.namespace = metricDict[metricFromForm].namespace;
        policyConfig.unit = metricDict[metricFromForm].unit;
        policyConfig.statistic = 'average';

        if (isPredictionOnFromForm == true && predictionModeFromForm != '?') {
          policyConfig.predictive = { mode: predictionModeFromForm };
        }

        let allScaleTargetPolicies = scalingObjForApi.target;

        // update existing policy
        if (existingPolicy) {
          allScaleTargetPolicies[existingPolicy.index] = policyConfig;
        }

        // create a new policy
        else {
          if (allScaleTargetPolicies) {
            allScaleTargetPolicies.push(policyConfig);
          } else {
            allScaleTargetPolicies = [policyConfig];
          }
        }

        scalingObjForApi.target = allScaleTargetPolicies;
        retVal = { group: { scaling: scalingObjForApi } };
        return retVal;
      }
    },
  ],
);
