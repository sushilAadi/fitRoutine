FROM node:20
WORKDIR /app

COPY package.json yarn.lock* ./
# IMPORTANT: install devDependencies too
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
