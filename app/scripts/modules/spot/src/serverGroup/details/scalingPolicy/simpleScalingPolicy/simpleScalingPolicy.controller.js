'use strict';

import { module } from 'angular';
import { cloneDeep } from 'lodash';

import { SERVER_GROUP_WRITER, TaskMonitor } from '@spinnaker/core';
import { ScalingPolicyWriter } from '../../ScalingPolicyWriter';
import { formToJSON } from '../../../helpers/formJsonHelper';
import { buildUpdateElastigroupCommand } from '../../../helpers/serverGroupHelper';
import {
  SCALING_ACTIONS_OPTIONS,
  SCALING_POLICIES_KINDS,
  SCALING_STATISTIC_OPTIONS,
  SCALING_METRIC_NAME_OPTIONS,
  SCALING_OPERATOR_OPTIONS,
  SCALING_PERIOD_OPTIONS,
} from 'root/app/scripts/modules/spot/src/serverGroup/details/scalingPolicy/constants';

export const SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER =
  'spinnaker.spot.serverGroup.details.scalingPolicy.simpleScalingPolicy.controller';
export const name = SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER, [SERVER_GROUP_WRITER]).controller(
  'spotSimpleScalingPolicyCtrl',
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

      $scope.statisticOptions = SCALING_STATISTIC_OPTIONS;
      $scope.metricNameOptions = SCALING_METRIC_NAME_OPTIONS;
      $scope.operatorOptions = SCALING_OPERATOR_OPTIONS;
      $scope.periodOptions = SCALING_PERIOD_OPTIONS;
      $scope.actionOptions = SCALING_ACTIONS_OPTIONS;

      $scope.defaultStatistic =
        this.policy && this.policy.statistic
          ? SCALING_STATISTIC_OPTIONS.find(stat => stat.value === this.policy.statistic)
          : SCALING_STATISTIC_OPTIONS[0];
      $scope.defaultMetricName =
        this.policy && this.policy.metricName
          ? SCALING_METRIC_NAME_OPTIONS.find(metric => metric.value === this.policy.metricName)
          : SCALING_METRIC_NAME_OPTIONS[0];
      $scope.defaultOperator =
        this.policy && this.policy.operator
          ? SCALING_OPERATOR_OPTIONS.find(op => op.value === this.policy.operator)
          : SCALING_OPERATOR_OPTIONS[0];
      $scope.defaultPeriod =
        this.policy && this.policy.period
          ? SCALING_PERIOD_OPTIONS.find(period => period.value === this.policy.period)
          : SCALING_PERIOD_OPTIONS[0];

      const isActionTypeValid = this.policy && this.policy.action && this.policy.action.type;
      $scope.defaultAction = isActionTypeValid
        ? SCALING_ACTIONS_OPTIONS.find(
            actionOption =>
              actionOption.typeUpperCase === this.policy.action.type && actionOption.scalingAction === this.policy.kind,
          )
        : SCALING_ACTIONS_OPTIONS[0];

      const actionType = isActionTypeValid
        ? SCALING_ACTIONS_OPTIONS.find(
            actionOption =>
              actionOption.typeUpperCase === this.policy.action.type && actionOption.scalingAction === this.policy.kind,
          ).typeUpperCase
        : '';
      let amount = 1;

      if (actionType === 'SET_MIN_TARGET') {
        amount = parseInt(this.policy.action.minTargetCapacity);
      } else if (actionType === 'SET_MAX_TARGET') {
        amount = parseInt(this.policy.action.maxTargetCapacity);
      } else if (actionType === 'PERCENTAGE_ADJUSTMENT' || actionType === 'ADJUSTMENT_NUMERIC') {
        amount = parseInt(this.policy.action.adjustment);
      }

      $scope.defaultAmount = amount;

      $scope.defaultThreshold = this.policy && this.policy.threshold ? this.policy.threshold : 50;
      $scope.defaultEvaluationPeriod = this.policy && this.policy.evaluationPeriods ? this.policy.evaluationPeriods : 3;
      $scope.defaultCoolDown = this.policy && this.policy.cooldown ? this.policy.cooldown : 300;

      $scope.defaultPolicyName = this.policy && this.policy.policyName ? this.policy.policyName : 'default policy name';
      $scope.policyUnit = $scope.defaultMetricName.unit;
      $scope.actionMeasureUnit = $scope.defaultAction.measureUnit;

      this.cancel = function() {
        $uibModalInstance.close();
      };

      this.setPolicyUnit = function() {
        const metric = document.getElementsByName('metricName')[0];
        const metricValue = metric.value;
        $scope.policyUnit = SCALING_METRIC_NAME_OPTIONS.find(metric => metric.value === metricValue).unit;
      };

      this.setActionMeasureUnit = function() {
        const action = document.getElementsByName('action')[0];
        const actionValue = action.value;
        $scope.actionMeasureUnit = SCALING_ACTIONS_OPTIONS.find(act => act.value === actionValue).measureUnit;
      };

      this.isValid = function() {
        const form = document.getElementsByName('spotSimpleScalingPolicyForm')[0];
        const formPolicyConfig = formToJSON(form.elements);

        if (
          formPolicyConfig.cooldown &&
          formPolicyConfig.amount &&
          formPolicyConfig.evaluationPeriods &&
          formPolicyConfig.threshold &&
          formPolicyConfig.policyName
        ) {
          return true;
        }

        return false;
      };

      this.submitSimpleScalingPolicy = function() {
        const form = document.getElementsByName('spotSimpleScalingPolicyForm')[0];
        const formPolicyConfig = formToJSON(form.elements);
        const policyConfigForSdk = buildPolicyConfigForApi(
          formPolicyConfig,
          this.policy,
          this.serverGroup.elastigroup.scaling,
        );
        const command = buildUpdateElastigroupCommand(policyConfigForSdk, this.serverGroup);

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

      function buildPolicyConfigForApi(formPolicyConfig, existingPolicy, scalingObjForApi) {
        let retVal = {};

        const actionFromForm = formPolicyConfig.action;
        const actionType = SCALING_ACTIONS_OPTIONS.find(act => act.value === actionFromForm).type;
        const metricFromForm = formPolicyConfig.metricName;
        const amountFromForm = formPolicyConfig.amount;
        const scalingAction = SCALING_ACTIONS_OPTIONS.find(act => act.value === actionFromForm).scalingAction;
        const policyConfig = cloneDeep(formPolicyConfig);

        policyConfig.namespace = SCALING_METRIC_NAME_OPTIONS.find(metric => metric.value === metricFromForm).namespace;
        policyConfig.unit = SCALING_METRIC_NAME_OPTIONS.find(metric => metric.value === metricFromForm).unit;

        if (
          actionFromForm === 'add' ||
          actionFromForm === 'remove' ||
          actionFromForm === 'increase' ||
          actionFromForm === 'decrease'
        ) {
          policyConfig.action = {
            type: actionType,
            adjustment: amountFromForm,
          };
        }
        if (actionFromForm === 'setMinTarget') {
          policyConfig.action = {
            type: actionType,
            minTargetCapacity: amountFromForm,
          };
        }
        if (actionFromForm === 'setMaxTarget') {
          policyConfig.action = {
            type: actionType,
            maxTargetCapacity: amountFromForm,
          };
        }

        let allScaleUpPolicies = scalingObjForApi.up;
        let allScaleDownPolicies = scalingObjForApi.down;
        //normalize the type field
        if (allScaleUpPolicies) {
          allScaleUpPolicies.forEach(
            scaleUp =>
              (scaleUp.action.type = $scope.actionOptions.find(
                act => act.typeUpperCase === scaleUp.action.type || act.type === scaleUp.action.type,
              ).type),
          );
        }
        if (allScaleDownPolicies) {
          allScaleDownPolicies.forEach(
            scaleDown =>
              (scaleDown.action.type = $scope.actionOptions.find(
                act => act.typeUpperCase === scaleDown.action.type || act.type === scaleDown.action.type,
              ).type),
          );
        }

        if (existingPolicy) {
          const kindOfPolicyBeforeUpdating = existingPolicy.kind;

          //update scale up policy - stay it scale up
          if (kindOfPolicyBeforeUpdating === SCALING_POLICIES_KINDS.UP && scalingAction === SCALING_POLICIES_KINDS.UP) {
            allScaleUpPolicies[existingPolicy.index] = policyConfig;
          }
          //update scale down policy - stay it scale down
          else if (
            kindOfPolicyBeforeUpdating === SCALING_POLICIES_KINDS.DOWN &&
            scalingAction === SCALING_POLICIES_KINDS.DOWN
          ) {
            allScaleDownPolicies[existingPolicy.index] = policyConfig;
          }
          //update scale up policy - transform it to scale down
          else if (
            kindOfPolicyBeforeUpdating === SCALING_POLICIES_KINDS.UP &&
            scalingAction === SCALING_POLICIES_KINDS.DOWN
          ) {
            if (allScaleDownPolicies) {
              allScaleDownPolicies.push(policyConfig);
            } else {
              allScaleDownPolicies = [policyConfig];
            }
            allScaleUpPolicies.splice(existingPolicy.index, 1);
            scalingObjForApi.up = allScaleUpPolicies;
            scalingObjForApi.down = allScaleDownPolicies;
          }
          //update scale down policy - transform it to scale up
          else if (
            kindOfPolicyBeforeUpdating === SCALING_POLICIES_KINDS.DOWN &&
            scalingAction === SCALING_POLICIES_KINDS.UP
          ) {
            if (allScaleUpPolicies) {
              allScaleUpPolicies.push(policyConfig);
            } else {
              allScaleUpPolicies = [policyConfig];
            }
            allScaleDownPolicies.splice(existingPolicy.index, 1);
            scalingObjForApi.up = allScaleUpPolicies;
            scalingObjForApi.down = allScaleDownPolicies;
          }
        } else {
          //new policy
          if (scalingAction === SCALING_POLICIES_KINDS.UP) {
            if (allScaleUpPolicies) {
              allScaleUpPolicies.push(policyConfig);
            } else {
              allScaleUpPolicies = [policyConfig];
            }
            scalingObjForApi.up = allScaleUpPolicies;
          } else if (scalingAction === SCALING_POLICIES_KINDS.DOWN) {
            if (allScaleDownPolicies) {
              allScaleDownPolicies.push(policyConfig);
            } else {
              allScaleDownPolicies = [policyConfig];
            }
            scalingObjForApi.down = allScaleDownPolicies;
          }
        }

        retVal = { group: { scaling: scalingObjForApi } };

        return retVal;
      }
    },
  ],
);
