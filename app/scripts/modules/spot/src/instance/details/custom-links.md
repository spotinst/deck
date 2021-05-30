## Custome-Links
you can use the next environment variables to build your own custom links:
### Spot

name | description | example 
--- | --- | ---
id | instance id| i-12345678
launchTime | timestamp of when instance launched | 1486146739000
account | Spot account Name | My-Spinnaker-Account
region | region where instance resides | us-east-1
availabilityZone | AZ where instance resides | us-east-1-a
lifeCycle | Spot or OD | OD
provider | spot| spot
baseIpAddress | the defined IP that is in use (public/private) | 104.156.81.74
publicIp | external IP address | 10.100.10.219
privateIp | internal IP address (within AWS) | 104.156.81.74
serverGroup | Elastigroup name | myapp-prod-v002
environment |the environment in which you work in| production
