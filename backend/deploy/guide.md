# Deploy Guide

## Start the server

```bash
$ gunicorn marker.asgi:application -k uvicorn.workers.UvicornWorker
```