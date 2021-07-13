import { module } from 'angular';

import { CloudProviderRegistry, DeploymentStrategyRegistry } from '@spinnaker/core';

import { COMMON_MODULE } from './common/common.module';
import { SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER } from './instance/details/instance.details.controller';
import { SPOT_PIPELINE_STAGES_CLONESERVERGROUP_SPOTCLONESERVERGROUPSTAGE } from './pipeline/stages/cloneServerGroup/spotCloneServerGroupStage';
import { SPOT_PIPELINE_STAGES_CREATESERVERGROUP_SPOTCREATESERVERGROUPSTAGE } from './pipeline/stages/createServerGroup/spotCreateServerGroupStage';
import { SPOT_PIPELINE_STAGES_DISABLE_SERVER_GROUP_STAGE } from './pipeline/stages/disableServerGroup/spotDisableServerGroupStage';
import { SPOT_PIPELINE_STAGES_FINDIMAGEFROMTAGS_SPOTFINDIMAGEFROMTAGSSTAGE } from './pipeline/stages/findImageFromTags/spotFindImageFromTagsStage';
import { SPOT_SERVERGROUP_CONFIGURE_SERVERGROUPCOMMANDBUILDER_SERVICE } from './serverGroup/configure/serverGroupCommandBuilder.service';
import { SPOT_SERVERGROUP_CONFIGURE_WIZARD_CREATESERVERGROUP_SPOT_CONTROLLER } from './serverGroup/configure/wizard/createServerGroup.spot.controller';
import { SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER } from './serverGroup/details/elastilogs/elastilogs.controller';
import { SPOT_SERVERGROUP_DETAILS_RESIZE_RESIZESERVERGROUP_CONTROLLER } from './serverGroup/details/resize/resizeServerGroup.controller';
import { SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_CONTROLLER } from './serverGroup/details/scalingPolicy/scalingPolicyCreation.controller';
import { SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER } from './serverGroup/details/scalingPolicy/simpleScalingPolicy/simpleScalingPolicy.controller';
import { SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER } from './serverGroup/details/scalingPolicy/targetScalingPolicy/targetScalingPolicy.controller';
import { SPOT_SERVERGROUP_DETAILS_SERVERGROUPDETAILS_CONTROLLER } from './serverGroup/details/serverGroupDetails.spot.controller';
import { SpotServerGroupTransformer } from './serverGroup/serverGroup.transformer';

import './logo/spot.logo.less';

const templates = require.context('./', true, /\.html$/);
templates.keys().forEach(function (key) {
  templates(key);
});

export const SPOT_MODULE = 'spinnaker.spot';
module(SPOT_MODULE, [
  COMMON_MODULE,
  // Server Groups
  SPOT_SERVERGROUP_DETAILS_SERVERGROUPDETAILS_CONTROLLER,
  SPOT_SERVERGROUP_DETAILS_RESIZE_RESIZESERVERGROUP_CONTROLLER,
  SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_CONTROLLER,
  SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_SIMPLE_CONTROLLER,
  SPOT_SERVERGROUP_DETAILS_SCALINGPOLICY_TARGET_CONTROLLER,
  SPOT_PIPELINE_STAGES_CLONESERVERGROUP_SPOTCLONESERVERGROUPSTAGE,
  SPOT_PIPELINE_STAGES_CREATESERVERGROUP_SPOTCREATESERVERGROUPSTAGE,
  SPOT_PIPELINE_STAGES_DISABLE_SERVER_GROUP_STAGE,
  SPOT_INSTANCE_DETAILS_INSTANCE_DETAILS_CONTROLLER,
  SPOT_PIPELINE_STAGES_FINDIMAGEFROMTAGS_SPOTFINDIMAGEFROMTAGSSTAGE,
  SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER,
  SPOT_SERVERGROUP_CONFIGURE_SERVERGROUPCOMMANDBUILDER_SERVICE,
  SPOT_SERVERGROUP_CONFIGURE_WIZARD_CREATESERVERGROUP_SPOT_CONTROLLER,
]).config(function () {
  CloudProviderRegistry.registerProvider('spot', {
    name: 'Spot',
    logo: {
      path: require('./logo/spotLogo.svg'),
    },
    serverGroup: {
      transformer: SpotServerGroupTransformer,
      detailsTemplateUrl: require('./serverGroup/details/serverGroupDetails.html'),
      detailsController: 'spotServerGroupDetailsCtrl',
      commandBuilder: 'spotServerGroupCommandBuilder',
      cloneServerGroupTemplateUrl: require('./serverGroup/configure/wizard/serverGroupWizard.html'),

      // cloneServerGroupController is required in allClusters.controller.js, but in reality we do not clone but create a new server group
      cloneServerGroupController: 'spotCreateServerGroupCtrl',
    },
    instance: {
      detailsController: 'spotInstanceDetailsCtrl',
      detailsTemplateUrl: require('./instance/details/instanceDetails.html'),
    },
  });
});

DeploymentStrategyRegistry.registerProvider('spot', []);