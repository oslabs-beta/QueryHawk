# Build stage for image
FROM node:22 AS builder

#creates directory called app in container
#for subsequent instructions in this file it'll run those in the container
WORKDIR /app

#copies package.json to working directory app
#this path is correct due to the context line for backend in compose file
#that context lines logically brings us to root level for writing paths here
COPY package*.json ./
COPY tsconfig.json ./

#install dependencies in container
RUN npm install
# RUN npm ci
#  . . copies all files from ./server into /app container
COPY server/ ./server/
COPY types/ ./types/

#express app runs on port 5000 in container 
# EXPOSE command is used to declare which port the container will listen to internally.
EXPOSE 4002

#execute! uses server script from json file
CMD ["npm", "run", "server"]



# Container port shold match the app port ideally.

# RUN is like building a house (installing fixtures, painting walls)
# CMD is like what you do when you move in (turning on lights)

# Think of it as:

# RUN: "Do this as part of setup"
# CMD: "Do this to start the app"

# Currently we are using tsx to auto transpile our TS to JS.
# For final product we would need to change tsx to tsc for better perfomance.
# This means our code will be located in a different location then server. 
# It will most likely be located in ./dist 
# We need to change our tsconfig.json outDir to "./dist" (When project is ready for production).
# docker build -t my-server -f server/Dockerfile .