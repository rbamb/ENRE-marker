# Deploy Guide

## Start the server

```bash
$ gunicorn --bind 0.0.0.0:8000 marker.asgi:application -k uvicorn.workers.UvicornWorker
```