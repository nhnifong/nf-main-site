
To be run in repo root in cloud shell

## Build and push monolithic site

```
gcloud builds submit --tag gcr.io/nf-web-480214/nf-site-monolith:1.0.0 .
```

Deploy

```
gcloud run deploy nf-site-monolith \
  --image gcr.io/nf-web-480214/nf-site-monolith:1.0.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --vpc-connector redis-connector \
  --set-env-vars REDIS_URL=redis://10.12.90.11:6379
```

## Set up redis

```
gcloud services enable redis.googleapis.com vpcaccess.googleapis.com
gcloud compute networks vpc-access connectors create redis-connector \
  --region us-central1 \
  --range 10.8.0.0/28
gcloud redis instances create nf-redis \
  --size=1 \
  --region=us-central1 \
  --tier=basic
```

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