'use strict';

import { module } from 'angular';

/**
 * This is STUB created to support serverGroupCommandBuilder.buildNewServerGroupCommand call in allClusters.controller.js
 */
export const SPOT_SERVERGROUP_CONFIGURE_SERVERGROUPCOMMANDBUILDER_SERVICE =
  'spinnaker.gce.serverGroupCommandBuilder.service';
export const name = SPOT_SERVERGROUP_CONFIGURE_SERVERGROUPCOMMANDBUILDER_SERVICE; // for backwards compatibility
module(SPOT_SERVERGROUP_CONFIGURE_SERVERGROUPCOMMANDBUILDER_SERVICE, []).factory('spotServerGroupCommandBuilder', [
  '$q',
  function ($q) {
    function buildNewServerGroupCommand(application, defaults) {
      const command = {};

      return $q.when(command);
    }

    return {
      buildNewServerGroupCommand: buildNewServerGroupCommand,
    };
  },
]);
