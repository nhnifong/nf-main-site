
To be run in repo root in cloud shell

## Build and push monolithic site

```
gcloud builds submit --tag gcr.io/${GOOGLE_CLOUD_PROJECT}/nf-site-monolith:1.0.0 .
```

Deploy

```
gcloud run deploy nf-site-monolith \
  --image gcr.io/${GOOGLE_CLOUD_PROJECT}/nf-site-monolith:1.0.0 \
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