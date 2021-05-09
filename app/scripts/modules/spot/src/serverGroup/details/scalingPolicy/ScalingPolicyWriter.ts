import { IPromise } from 'angular';

import { Application, ITask, TaskExecutor } from '@spinnaker/core';

export class ScalingPolicyWriter {
  public static updateScalingPolicy(application: Application, command: any): IPromise<ITask> {
    return TaskExecutor.executeTask({
      application: application,
      description: 'update scaling policy ',
      job: [command],
    });
  }
}
