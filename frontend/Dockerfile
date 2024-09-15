FROM node:hydrogen-alpine3.20
WORKDIR /frontend
COPY . /frontend
RUN npm install
RUN npm install -g serve
RUN npm run build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
