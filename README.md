# nf-main-site
Homepage for Neufangled Robotics

## Run locally
```
sudo service redis-server start
uvicorn app.main:app --host=0.0.0.0 --port=8080
```

or test container with
```
gcloud beta code dev
```