'use strict';

import { module } from 'angular';

import { SERVER_GROUP_WRITER, TaskMonitor } from '@spinnaker/core';
import { ScalingPolicyWriter } from '../ScalingPolicyWriter';

export const SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER =
  'spinnaker.spot.serverGroup.details.scalingPolicy.simpleScalingPolicy.controller';
export const name = SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER, [SERVER_GROUP_WRITER]).controller(
  'spotSimpleScalingPolicyCtrl',
  [
    '$scope',
    '$uibModalInstance',
    'action',
    'serverGroup',
    'application',
    function($scope, $uibModalInstance, action, serverGroup, application) {
      this.action = action;
      this.serverGroup = serverGroup;

      $scope.statisticOptions = [
        {
          label: 'Average',
          value: 'average',
        },
        {
          label: 'Maximum',
          value: 'maximum',
        },
        {
          label: 'Minimum',
          value: 'minimum',
        },
        {
          label: 'Sum',
          value: 'sum',
        },
        {
          label: 'Sample Count',
          value: 'sampleCount',
        },
      ];
      $scope.defaultStatistic = $scope.statisticOptions[0];

      $scope.metricNameOptions = [
        {
          label: 'EC2 - CPU Utilization',
          value: 'CPUUtilization',
        },
        {
          label: 'EC2 - Network Out',
          value: 'NetworkOut',
        },
        {
          label: 'ELB - Latency',
          value: 'Latency',
        },
      ];
      $scope.defaultMetricName = $scope.metricNameOptions[0];

      $scope.operatorOptions = [
        {
          label: '>=',
          value: 'gte',
        },
        {
          label: '<=',
          value: 'lte',
        },
        {
          label: '<',
          value: 'lt',
        },
        {
          label: '>',
          value: 'gt',
        },
      ];
      $scope.defaultOperator = $scope.operatorOptions[0];

      $scope.periodOptions = [
        {
          label: '5 Minutes',
          value: 300,
        },
        {
          label: '15 Minutes',
          value: 900,
        },
        {
          label: '1 Hour',
          value: 3600,
        },
        {
          label: '6 Hours',
          value: 21600,
        },
        {
          label: '1 Day',
          value: 86400,
        },
      ];
      $scope.defaultPeriod = $scope.periodOptions[0];

      $scope.actionOptions = [
        {
          label: 'Add',
          value: 'add',
        },
        {
          label: 'Remove',
          value: 'remove',
        },
        {
          label: 'Increase',
          value: 'increase',
        },
        {
          label: 'Decrease',
          value: 'decrease',
        },
        {
          label: 'Set minimum of',
          value: 'setMinTarget',
        },
        {
          label: 'Set maximum of',
          value: 'setMaxTarget',
        },
      ];
      $scope.defaultAction = $scope.actionOptions[0];

      $scope.defaultThreshold = 50;
      $scope.defaultAmountOfInstances = 1;
      $scope.defaultEvaluationPeriod = 3;
      $scope.defaultCoolDown = 300;

      $scope.defaultPolicyName = 'default policy name';

      this.cancel = function() {
        $uibModalInstance.close();
      };

      this.isValid = function() {
        return true;
      };

      this.submitSimpleScalingPolicy = function() {
        if (!this.isValid()) {
          return;
        }
        const form = document.getElementsByName('spotSimpleScalingPolicyForm')[0];
        const formPolicyConfig = formToJSON(form.elements);
        const policyConfigForSdk = buildPolicyConfigForApi(formPolicyConfig);
        const command = buildUpdateScalingPolicyCommand(policyConfigForSdk);

        $scope.taskMonitor = new TaskMonitor({
          application: application,
          title: 'Update scaling policy in ' + serverGroup.name,
          modalInstance: $uibModalInstance,
        });

        const submitMethod = function() {
          return ScalingPolicyWriter.updateScalingPolicy(application, command);
        };

        $scope.taskMonitor.submit(submitMethod);
      };

      function buildUpdateScalingPolicyCommand(policyConfigForSdk) {
        return {
          type: 'updateElastigroup',
          cloudProvider: 'spot',
          credentials: serverGroup.account,
          region: serverGroup.region,
          serverGroupName: serverGroup.name,
          elastigroupId: serverGroup.elastigroup.id,
          groupToUpdate: { group: { scaling: { up: [policyConfigForSdk] } } },
        };
      }

      function buildPolicyConfigForApi(formPolicyConfig) {
        const retVal = formPolicyConfig;
        const actionFromForm = formPolicyConfig.action;
        if (actionFromForm === 'add') {
          retVal.action = {
            type: 'adjustment',
            adjustment: formPolicyConfig.adjustment,
          };
          retVal.namespace = 'AWS/EC2';
          retVal.unit = 'percent';
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
