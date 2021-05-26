import { $log } from 'ngimport';

import { REST } from 'core/api/ApiService';
import { IServerGroup } from 'core/domain';

export class ServerGroupReader {
  public static getScalingActivities(serverGroup: IServerGroup): PromiseLike<any[]> {
    return REST('/applications')
      .path(
        serverGroup.app,
        'clusters',
        serverGroup.account,
        serverGroup.cluster,
        'serverGroups',
        serverGroup.name,
        'scalingActivities',
      )
      .query({
        region: serverGroup.region,
        provider: serverGroup.cloudProvider,
      })
      .get()
      .catch((error: any): any[] => {
        $log.error(error, 'error retrieving scaling activities');
        return [];
      });
  }

  public static getServerGroup(
    application: any,
    account: string,
    region: string,
    serverGroupName: string,
  ): PromiseLike<IServerGroup> {
    return REST('/applications')
      .path(application, 'serverGroups', account, region, serverGroupName)
      .query({ includeDetails: 'false' })
      .get();
  }

  public static getElastilogs(
    serverGroup: any,
    elastigroupId: string,
    fromDate: string,
    toDate: string,
    severity: string,
  ): IPromise<any[]> {
    return API.one('applications')
      .one(serverGroup.application)
      .all('clusters')
      .all(serverGroup.account)
      .all(serverGroup.cluster)
      .one('serverGroups', serverGroup.name)
      .all('elastilogs')
      .withParams({
        elastigroupId: elastigroupId,
        fromDate: fromDate,
        toDate: toDate,
        severity: severity,
        provider: serverGroup.cloudProvider,
      })
      .getList()
      .catch((error: any): any[] => {
        $log.error(error, 'error retrieving elastilogs');
        return [];
      });
  }
}
