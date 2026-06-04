# VPS Deployment

This guide explains how to deploy GigaHub OS on a VPS using prebuilt Docker images.

The recommended production flow is:

```txt
GitHub push
  -> GitHub Actions verifies the project
  -> GitHub Actions builds Docker images
  -> Images are published to GitHub Container Registry
  -> The VPS pulls and runs those images
  -> Caddy routes public domains to local container ports
```

The VPS does not need the full source code, `node_modules`, or build artifacts.

## Production domains

Recommended domains:

```txt
gigahub.dyniqo.dev
api.gigahub.dyniqo.dev
```

DNS records should point both names to the VPS IP address:

```txt
gigahub.dyniqo.dev       A      <VPS_IP>
api.gigahub.dyniqo.dev   A      <VPS_IP>
```

## Required files on the VPS

Only these files are required in the deployment directory:

```txt
docker-compose.prod.yml
.env.production
```

Create the deployment directory:

```bash
sudo mkdir -p /opt/dyniqo/gigahub
cd /opt/dyniqo/gigahub
```

Copy `docker-compose.prod.yml` into this directory.

Create `.env.production` from the example:

```bash
nano .env.production
```

Example:

```env
COMPOSE_PROJECT_NAME=gigahub
APP_NAME=GigaHub OS

POSTGRES_PASSWORD=change-this-to-a-strong-password
JWT_ACCESS_SECRET=change-this-to-a-long-random-secret
JWT_REFRESH_SECRET=change-this-to-another-long-random-secret

IMAGE_TAG=latest

API_PREFIX=api
API_VERSION=1
SWAGGER_ENABLED=false
SWAGGER_PATH=docs
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

CORS_ORIGINS=https://gigahub.dyniqo.dev

WEB_PORT=18080
API_PORT=13000
```

Generate strong secrets on the VPS:

```bash
openssl rand -base64 48
```

Do not commit `.env.production`.

## GitHub Container Registry access

The production compose file pulls images from GitHub Container Registry:

```txt
ghcr.io/dyniqo/gigahub-migrate
ghcr.io/dyniqo/gigahub-api
ghcr.io/dyniqo/gigahub-worker
ghcr.io/dyniqo/gigahub-web
```

If the images are private, log in on the VPS with a GitHub Personal Access Token that has package read access:

```bash
echo '<GITHUB_PAT>' | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
```

If the images are public, this login may not be required.

## Start the application

```bash
cd /opt/dyniqo/gigahub

docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

Check status:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

View logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f migrate api worker web
```

## Configure Caddy

Caddy should be the public reverse proxy for all portfolio projects on the VPS.

Example `/etc/caddy/Caddyfile` entries:

```caddyfile
gigahub.dyniqo.dev {
  reverse_proxy 127.0.0.1:18080
}

api.gigahub.dyniqo.dev {
  reverse_proxy 127.0.0.1:13000
}
```

Validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Health checks

From the VPS:

```bash
curl http://127.0.0.1:13000/api/v1/health/ready
curl http://127.0.0.1:18080
```

From the public internet:

```bash
curl https://api.gigahub.dyniqo.dev/api/v1/health/ready
curl https://gigahub.dyniqo.dev
```

## Update the deployment

After GitHub Actions publishes new images:

```bash
cd /opt/dyniqo/gigahub

docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Roll back

Images are published with both `latest` and the Git commit SHA.

To roll back, set `IMAGE_TAG` in `.env.production` to a previous commit SHA:

```env
IMAGE_TAG=<commit-sha>
```

Then run:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Stop services

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Do not use `down -v` unless you intentionally want to delete the PostgreSQL production volume.

## Notes

- Do not copy `node_modules` to the VPS.
- Do not build images on the VPS unless you are intentionally debugging a build issue.
- Do not commit `.env.production` or real secrets.
- Keep PostgreSQL data in the Docker volume.
- Keep public traffic behind Caddy or another reverse proxy.
- Expose app containers only on `127.0.0.1` unless there is a specific reason to make them public.
