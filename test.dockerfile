FROM node:12-alpine
WORKDIR /usr/src/app
COPY package*.json ./
ENV NODE_ENV dev
RUN npm install
RUN npm install -g mocha
#RUN npm ci --only=production
COPY . .
EXPOSE 8080
#CMD [ "node", "app.js" ]
CMD ["mocha", "tests/*test.js", "--exit"]