# Docker 기반 실시간 투표 애플리케이션 v2

## 1. 프로젝트 개요

Docker Compose를 활용하여 **투표 앱, 실시간 대시보드, API 서버, 데이터베이스**를 한 번에 실행하는 Full-Stack 애플리케이션입니다.

각 서비스는 Docker 컨테이너로 격리되어 독립적으로 실행되며, Docker의 가상 네트워크를 통해 서로 통신합니다.

## 2. 기술 스택

- **프론트엔드 (투표 앱 & 대시보드)**: `React.js`
- **백엔드 (API 서버)**: `Node.js`, `Express.js`
- **데이터베이스**: `PostgreSQL`
- **컨테이너 오케스트레이션**: `Docker Compose`

## 3. 시스템 아키텍처

```
               (User's Browser)
        ┌──────────────┴──────────────┐
        │                             │
Accesses via localhost:[PORT]
        │                             │
┌───────▼───────┐             ┌───────▼───────┐
│  Voting App   │             │   Dashboard   │
│   (:3000)     │             │    (:3002)    │
└───────┬───────┘             └───────┬───────┘
        │                             │
        └─────────┐         ┌─────────┘
                  │         │
                  ▼         ▼
┌───────────────────────────────────────────┐
│                API Server                 │
│ (:3001, also directly accessible by user) │
└─────────────────────┬─────────────────────┘
                      │ (Docker Network)
                      │ (Connects to 'postgres')
                      ▼
┌───────────────────────────────────────────┐
│                PostgreSQL                 │
│                     (DB)                  │
└───────────────────────────────────────────┘
```

- **voting-app (포트 3000)**: 사용자가 점심 메뉴를 선택하고 투표하는 UI를 제공합니다.
- **dashboard (포트 3002)**: 투표 결과를 실시간 차트로 시각화하여 보여주는 대시보드입니다.
- **voting-api (포트 3001)**: 투표 데이터를 처리하고, 투표 결과를 조회하는 REST API를 제공합니다.
- **postgres**: 모든 투표 데이터를 영구적으로 저장하는 데이터베이스입니다.

## 4. 실행 방법

**요구사항**: `Docker`와 `Docker Compose`가 설치되어 있어야 합니다.

프로젝트 루트 디렉토리에서 아래 명령어 하나만 실행하면 모든 서비스가 시작됩니다.

```bash
docker compose up --build -d
```

- `--build`: 이미지를 새로 빌드합니다. (코드 변경 시 필수)
- `-d`: 컨테이너를 백그라운드에서 실행합니다.

### 서비스 접속

- **투표 앱**: [http://localhost:3000](http://localhost:3000)
- **결과 대시보드**: [http://localhost:3002](http://localhost:3002)
- **API 서버 상태 확인**: [http://localhost:3001](http://localhost:3001)

## 5. 모든 서비스 종료 및 데이터 삭제

모든 컨테이너를 중지하고 삭제하려면 다음 명령어를 실행하세요.

```bash
docker compose down
```

데이터베이스에 저장된 모든 투표 기록을 완전히 삭제하고 싶다면, 아래 명령어를 추가로 실행하여 Docker 볼륨을 제거하세요.

```bash
docker volume rm 1docker_postgres_data
```
> **참고**: 볼륨 이름(`1docker_postgres_data`)은 프로젝트 디렉토리 이름에 따라 달라질 수 있습니다. `docker volume ls`로 정확한 이름을 확인하세요.

## 6. 프로젝트 구조

```
.
├── ReadMe.md
├── api-server/      # Node.js 백엔드
│   ├── Dockerfile
│   └── ...
├── dashboard/       # React 대시보드
│   ├── Dockerfile
│   └── ...
├── database/        # DB 초기화 스크립트
│   └── init.sql
├── docker-compose.yaml # 서비스 전체 정의
└── voting-app/      # React 투표 앱
    ├── Dockerfile
    └── ...
```