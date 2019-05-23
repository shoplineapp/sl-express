FROM node:10.15.3

ENV APP_DIR=/app

COPY package.json $APP_DIR/package.json

RUN cd $APP_DIR \
    && npm i \
    && npm i -g nodemon

COPY . $APP_DIR

WORKDIR $APP_DIR

EXPOSE 3000

CMD ["nodemon", "server.js"]
