'use strict';

import { module } from 'angular';
import { cloneDeep } from 'lodash';

import { SERVER_GROUP_WRITER, TaskMonitor } from '@spinnaker/core';
import { ScalingPolicyWriter } from '../../ScalingPolicyWriter';

export const SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER =
  'spinnaker.spot.serverGroup.details.scalingPolicy.targetScalingPolicy.controller';
export const name = SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER, [SERVER_GROUP_WRITER]).controller(
  'spotTargetScalingPolicyCtrl',
  [
    '$scope',
    '$uibModalInstance',
    'action',
    'serverGroup',
    'application',
    function($scope, $uibModalInstance, action, serverGroup, application) {
      this.action = action;
      this.serverGroup = serverGroup;

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

      $scope.defaultPolicyName = 'default policy name';
      $scope.defaultMetricName = $scope.metricNameOptions[0];
      $scope.defaultTarget = 50;
      $scope.defaultCoolDown = 300;
      $scope.default;
      $scope.defaultPrediction = false;
      $scope.defaultMode = $scope.predictionModeOptions[0];
      this.cancel = function() {
        $uibModalInstance.close();
      };

      this.isValid = function() {
        return true;
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
        const policyConfigForSdk = buildPolicyConfigForApi(formPolicyConfig);
        const command = buildUpdateScalingPolicyCommand(policyConfigForSdk);

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

      function buildPolicyConfigForApi(formPolicyConfig) {
        let retVal;
        const scalingAction = 'target';
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

        if (scalingAction === 'target') {
          retVal = { group: { scaling: { target: [policyConfig] } } };
        }

        return retVal;
      }

      /**
       * Checks that an element has a non-empty `name` and `value` property.
       * @param  {Element} element  the element to check
       * @return {Bool}             true if the element is an input, false if not
       */
      const isValidElement = element => {
        return element.name && element.value;
      };

      /**
       * Checks if an element’s value can be saved (e.g. not an unselected checkbox).
       * @param  {Element} element  the element to check
       * @return {Boolean}          true if the value should be added, false if not
       */
      const isValidValue = element => {
        return !['checkbox', 'radio'].includes(element.type) || element.checked;
      };

      /**
       * Checks if an input is a checkbox, because checkboxes allow multiple values.
       * @param  {Element} element  the element to check
       * @return {Boolean}          true if the element is a checkbox, false if not
       */
      const isCheckbox = element => element.type === 'checkbox';

      /**
       * Checks if an input is a `select` with the `multiple` attribute.
       * @param  {Element} element  the element to check
       * @return {Boolean}          true if the element is a multiselect, false if not
       */
      const isMultiSelect = element => element.options && element.multiple;

      /**
       * Retrieves the selected options from a multi-select as an array.
       * @param  {HTMLOptionsCollection} options  the options for the select
       * @return {Array}                          an array of selected option values
       */
      const getSelectValues = options =>
        [].reduce.call(
          options,
          (values, option) => {
            return option.selected ? values.concat(option.value) : values;
          },
          [],
        );

      /**
       * Retrieves input data from a form and returns it as a JSON object.
       * @param  {HTMLFormControlsCollection} elements  the form elements
       * @return {Object}                               form data as an object literal
       */
      const formToJSON = elements =>
        [].reduce.call(
          elements,
          (data, element) => {
            // Make sure the element has the required properties and should be added.
            if (isValidElement(element) && isValidValue(element)) {
              /*
               * Some fields allow for more than one value, so we need to check if this
               * is one of those fields and, if so, store the values as an array.
               */
              if (isCheckbox(element)) {
                data[element.name] = (data[element.name] || []).concat(element.value);
              } else if (isMultiSelect(element)) {
                data[element.name] = getSelectValues(element);
              } else {
                data[element.name] = element.value;
              }
            }

            return data;
          },
          {},
        );
    },
  ],
);
