export const SCALING_POLICIES_KINDS = {
  UP: 'up',
  DOWN: 'down',
  TARGET: 'target',
};

export const SCALING_ACTIONS_OPTIONS = [
  {
    label: 'Add',
    value: 'add',
    scalingAction: 'up',
    type: 'adjustment',
    typeUpperCase: 'ADJUSTMENT_NUMERIC',
    measureUnit: 'instances',
  },
  {
    label: 'Remove',
    value: 'remove',
    scalingAction: 'down',
    type: 'adjustment',
    typeUpperCase: 'ADJUSTMENT_NUMERIC',
    measureUnit: 'instances',
  },
  {
    label: 'Increase',
    value: 'increase',
    scalingAction: 'up',
    type: 'percentageAdjustment',
    typeUpperCase: 'PERCENTAGE_ADJUSTMENT',
    measureUnit: 'percents',
  },
  {
    label: 'Decrease',
    value: 'decrease',
    scalingAction: 'down',
    type: 'percentageAdjustment',
    typeUpperCase: 'PERCENTAGE_ADJUSTMENT',
    measureUnit: 'percents',
  },
  {
    label: 'Set minimum of',
    value: 'setMinTarget',
    scalingAction: 'up',
    type: 'setMinTarget',
    typeUpperCase: 'SET_MIN_TARGET',
    measureUnit: 'instances',
  },
  {
    label: 'Set maximum of',
    value: 'setMaxTarget',
    scalingAction: 'down',
    type: 'setMaxTarget',
    typeUpperCase: 'SET_MAX_TARGET',
    measureUnit: 'instances',
  },
];

export const SCALING_STATISTIC_OPTIONS = [
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

export const SCALING_METRIC_NAME_OPTIONS = [
  {
    label: 'EC2 - CPU Utilization',
    value: 'CPUUtilization',
    namespace: 'AWS/EC2',
    unit: 'percent',
  },
  {
    label: 'EC2 - Network Out',
    value: 'NetworkOut',
    namespace: 'AWS/EC2',
    unit: 'bytes',
  },
  {
    label: 'ELB - Latency',
    value: 'Latency',
    namespace: 'AWS/ELB',
    unit: 'seconds',
  },
];

export const SCALING_OPERATOR_OPTIONS = [
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

export const SCALING_PERIOD_OPTIONS = [
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
