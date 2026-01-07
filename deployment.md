
To be run in repo root in cloud shell

## Build and push monolithic site

    gcloud builds submit --tag gcr.io/nf-web-480214/nf-site-monolith:1.2.0 .

Deploy site monolith to cloud run

```
gcloud run deploy nf-site-monolith-staging \
  --image gcr.io/nf-web-480214/nf-site-monolith:1.2.0 \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --vpc-connector redis-connector \
  --set-env-vars REDIS_URL=redis://10.83.184.211:6379
```

Push images to bucket

    gsutil -m rsync -r nf-viz/public/assets gs://nf-site-assets-staging/assets

## Set up redis

```
gcloud services enable redis.googleapis.com vpcaccess.googleapis.com
gcloud compute networks vpc-access connectors create redis-connector \
  --region us-east1 \
  --range 10.8.0.0/28
gcloud redis instances create nf-redis \
  --size=1 \
  --region=us-east1 \
  --tier=basic
```

## Set up a new media gateway vm

unfortunately google deprecated the easy method in favor of something much more annoying and difficult
you either cough up some more money for kubernetes, or you ssh into the vm and build and run the thing in docker that way.

    gcloud compute ssh media-gateway-vm --zone=us-east1-c

clone the repo and cd into it, then

    sudo media_gateway/new-vm-script.sh
    sudo media_gateway/boot-script.sh

### Reload the media the VM

The boot script can be updated with

    gcloud compute instances add-metadata media-gateway-vm     --zone=us-east1-c     --metadata-from-file startup-script=media_gateway/boot-script.sh

each time the VM is rebooted after that it builds the media server from this repo in the main branch and launches it.

## Set up firewall rule for media server

```
gcloud compute firewall-rules create allow-media-ports \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:1935,tcp:8888,tcp:8889,tcp:8554,udp:8189 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=media-server
```

the media server vm must also have the tag that makes this firewall rule apply to it.

    gcloud compute instances add-tags media-gateway-vm --zone=us-east1-c --tags=media-server

