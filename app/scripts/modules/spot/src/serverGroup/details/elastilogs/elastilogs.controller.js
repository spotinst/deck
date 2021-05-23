'use strict';
import { module } from 'angular';

import { ServerGroupReader } from '@spinnaker/core';

export const SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER =
  'spinnaker.spot.serverGroup.details.elastilogs.elastilogs.controller';
export const name = SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER; // for backwards compatibility
module(SPOT_SERVERGROUP_DETAILS_ELASTILOGS_CONTROLLER, []).controller('spotElastilogsCtrl', [
  '$scope',
  '$uibModalInstance',
  'action',
  'serverGroup',
  'application',
  function($scope, $uibModalInstance, action, serverGroup, application) {
    this.action = action;
    this.serverGroup = serverGroup;
    this.application = application;

    this.close = function() {
      $uibModalInstance.close();
    };

    this.handleElastilogs = function(elastilogs) {
      this.elastilogs = elastilogs;
    };

    this.getElastilogs = function() {
      this.elastilogs = [];
      this.viewState = {
        loading: true,
        error: false,
      };
      ServerGroupReader.getElastilogs(
        this.serverGroup,
        this.serverGroup.elastigroup.id,
        '2021-05-09T00:00:00.000+00:00',
        '2021-05-23T00:00:00.000+00:00',
        'INFO',
      ).then(
        elastilogs => {
          this.viewState.loading = false;
          this.handleElastilogs(elastilogs);
        },
        () => {
          this.viewState.error = true;
        },
      );
    };

    this.getElastilogs();
  },
]);
