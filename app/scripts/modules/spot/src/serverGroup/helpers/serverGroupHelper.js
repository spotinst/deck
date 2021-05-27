export function buildUpdateElastigroupCommand(groupJson, serverGroup) {
  return {
    type: 'updateElastigroup', //type of task in orca and clouddriver
    cloudProvider: 'spot',
    credentials: serverGroup.account,
    region: serverGroup.region,
    serverGroupName: serverGroup.name,
    elastigroupId: serverGroup.elastigroup.id,
    groupToUpdate: groupJson,
  };
}
