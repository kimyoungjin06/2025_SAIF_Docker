# Docker 투표 앱 v1

## 개요
Docker 컨테이너를 이용한 투표 웹 애플리케이션

## 구성
```
voting-project/
├── voting-app/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   │   ├── saif_logo.png
│   │   └── lecturer.png
│   └── src/
│       ├── App.js
│       ├── index.js
│       └── index.css
├── api-server/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── README.md
```

- **프론트엔드**: React.js 투표 인터페이스
- **백엔드**: Express.js API 서버
- **데이터 저장**: 메모리 (임시)
- **네트워킹**: Docker network

## 실행 방법

### 1. 네트워크 생성
```bash
docker network create voting-network
```

### 2. API Server 실행
```bash
cd api-server
docker build -t voting-api .
docker run --name voting-api --network voting-network -p 3001:3001 voting-api
```


## Step0: git clone
```bash
git clone 2025_SAIF_Docker
```



## Step1: voting-app
```bash
cd ../voting-app
docker build -t voting-app .
docker run --name voting-frontend --network voting-network -p 3000:3000 voting-app
```

## Step2: voting-api
```bash
cd api-server
docker build -t voting-api .
docker run --name voting-api --network voting-network -p 3001:3001 voting-api
```

## Step3: Docker Network

```bash
docker network create voting-network
docker run --network voting-network --name voting-api -p 3001:3001 voting-api
docker run --network voting-network --name voting-frontend -p 3000:3000 voting-app
```