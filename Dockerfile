FROM node:latest

WORKDIR /privacheck

COPY . .

RUN npm install
RUN npx playwright install
RUN npx playwright install-deps

EXPOSE 3000

CMD ["npm", "run", "server"]