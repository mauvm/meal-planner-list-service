# Meal Planner: List Service

> API for managing list items

This TypeScript service is part of the [Meal Planner project](https://github.com/users/mauvm/projects/1).

This service uses [NeDB](https://github.com/louischatriot/nedb) for local event persistance.

## Local Development

```bash
# Configure
cp .env.example .env
chmod 600 .env
edit .env

yarn install

yarn dev
yarn test:dev
```

## Deploy to Production

```bash
# Configure Docker CLI
eval $(minikube docker-env) # Or "minikube docker-env | Invoke-Expression" on Windows

# Build Docker image
docker build -t list-service .

# Deploy via infrastructure repository
```

### Github Actions

For Docker image builds with Github Actions you must configure the following secrets:

- `DOCKER_HOST`: domain name for custom registry, leave blank to use Docker Hub
- `DOCKER_USERNAME`: username for registry authentication
- `DOCKER_PASSWORD`: password for registry authentication
- `DOCKER_REPOSITORY`: the repository/user and image name, for example: `meal-planner/list-service`
