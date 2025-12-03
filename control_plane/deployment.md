
Build and push

```
gcloud builds submit --tag gcr.io/your-project/control-plane .
```

Deploy

```
gcloud run deploy control-plane \
  --image gcr.io/your-project/control-plane \
  --platform managed \
  --allow-unauthenticated \
  --vpc-connector my-vpc-connector
```