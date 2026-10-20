# node:22 karena dependency cn@0.5.0 mensyaratkan Node >= 22
FROM node:22-alpine
WORKDIR /app

# Variabel NEXT_PUBLIC_* di-inline ke bundle saat build,
# jadi harus dikirim lewat build args (docker-compose: build.args), bukan environment
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy package files dan install dependencies
# npm ci lebih deterministik daripada npm install karena mengikuti package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci

# Copy seluruh source code dan build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
