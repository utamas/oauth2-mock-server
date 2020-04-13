FROM node:12.16.1

WORKDIR /usr/src/adaca/oauth2-mock-server

# Minor optimization: copy package*.json files and install dependencies
# package* files are changing less frequently and will increate docker
# cache hit rate.
COPY package*.json ./
RUN npm i

# Source changes more often, so those are copied and worked on separately.
COPY . .
#RUN npm run-script test
RUN npm link

ENV SERVICE_HOST=0.0.0.0
ENV SERVICE_PORT=8080

ENV MANAGEMENT_API_HOST=0.0.0.0
ENV MANAGEMENT_API_PORT=9000

USER node
CMD oauth2-mock-server -a ${SERVICE_HOST} -p ${SERVICE_PORT} --management-address ${MANAGEMENT_API_HOST} --management-port ${MANAGEMENT_API_PORT}
