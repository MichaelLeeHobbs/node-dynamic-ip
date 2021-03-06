FROM node:14.13.1-alpine

WORKDIR /opt/node-dynamic-ip
COPY package* ./
RUN npm install
COPY src src

ENV NPM_CONFIG_LOGLEVEL info
USER node
CMD node src monitor config.json