Made a db file. If you want to use pool make sure to import properly.

Ideally you should import this into the models file as the logic is managed there. While the controller manages the handling of requests.

import { pool } from '../db/db.ts';

Models Folder (Database Interaction)
Controller Folder (Request Handling)
Routes Folder (Mapping Endpoints to controllers)

To get access to our types folder from controller, or models we need to import it properly:
import { (name of type or interface you are trying to import) } from '../../types/types.ts';

Docker

Steps to create container:

1. Build the Docker Image:
   docker build -t <image_name>:<tag> .
   Example:
   docker build -t my-server -f server/Dockerfile .

2. Verify the Image was build:
   docker images

3. Create and Start a New Container
   docker run -p <host_port>:<container_port> --name <container_name>
   Example:
   docker run -p 4002:4001 my-server

To find containers ID or containers name:
docker ps

To stop container:
docker stop <container_name> or docker stop <container_id>

Optional remove container after stopping it:
docker rm <container_name> or docker rm <container_id>

Rebuilds container:
docker-compose build (name)

Use all container from docker-compose.yml:
docker-compose up

Remove all containers that are running that came from the docker-compose.yml file:
docker-compose down

Stop all containers:
docker stop $(docker ps -aq)

Remove all containers:
docker rm $(docker ps -aq)

Remove all images:
docker rmi $(docker images -q)

remove all volumes:
docker volume rm $(docker volume ls -q)

remove all network volumes:
docker network prune

Remove all dangling resources:
docker system prune -a


## Local Development Setup

1. Clone the repository
```bash
git clone https://github.com/oslabs-beta/QueryHawk.git
cd queryhawk