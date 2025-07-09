# Node.js 18 Alpine 리눅스 기반 이미지 사용 (가볍고 빠름)
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사 (의존성 설치를 위해)
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 빌드 타임에 환경 변수 설정
ARG REACT_APP_API_URL=http://voting-api:3001
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# 앱이 사용할 포트 노출
EXPOSE 3000

# 개발 서버 실행
CMD ["npm", "start"]