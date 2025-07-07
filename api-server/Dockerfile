# Node.js 18 Alpine 기반
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3001

# 환경 변수 설정
ENV NODE_ENV=production

# 서버 시작
CMD ["npm", "start"]