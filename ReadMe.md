# Docker 기반 실시간 투표 애플리케이션 v3

## 1. 프로젝트 개요

Docker Compose를 활용하여 **투표 앱, 실시간 대시보드, API 서버, 데이터베이스**를 한 번에 실행하는 Full-Stack 애플리케이션입니다.

이 프로젝트는 여러 사용자가 자신만의 독립된 개발 환경을 가질 수 있도록 설계되었습니다. `setup-user-env.sh` 스크립트를 통해 각 사용자별로 포트와 리소스가 충돌하지 않는 개별 환경을 동적으로 생성할 수 있습니다.

## 2. 기술 스택

- **프론트엔드 (투표 앱 & 대시보드)**: `React.js`
- **백엔드 (API 서버)**: `Node.js`, `Express.js`
- **데이터베이스**: `PostgreSQL`
- **컨테이너 오케스트레이션**: `Docker Compose`
- **환경 구성**: `Shell Script`

## 3. 시스템 아키텍처

각 사용자는 아래와 같은 독립적인 서비스 그룹을 소유하게 됩니다. 모든 서비스는 외부에서 `localhost:[PORT]`를 통해 접근 가능합니다.

```
               (User's Browser)
        ┌──────────────┴──────────────┐
        │                             │
Accesses via localhost:[PORT]
        │                             │
┌───────▼───────┐             ┌───────▼───────┐
│  Voting App   │             │   Dashboard   │
│   (User Port) │             │   (User Port) │
└───────┬───────┘             └───────┬───────┘
        │                             │
        └─────────┐         ┌─────────┘
                  │         │
                  ▼         ▼
┌───────────────────────────────────────────┐
│                API Server                 │
│   (User Port, also directly accessible)   │
└─────────────────────┬─────────────────────┘
                      │ (Docker Network)
                      │ (Connects to 'postgres')
                      ▼
┌───────────────────────────────────────────┐
│                PostgreSQL                 │
│              (User Database)              │
└───────────────────────────────────────────┘
```

## 4. 개별 실습 환경 실행 방법

**요구사항**: `Docker`와 `Docker Compose`가 설치되어 있어야 합니다.

#### 1단계: 개별 환경 설정 스크립트 실행

프로젝트 루트 디렉토리에서 아래 명령어를 실행하여 설정 스크립트를 시작합니다.

```bash
./setup-user-env.sh
```

스크립트가 실행되면 사용자 ID를 입력하라는 메시지가 나타납니다.

> **⚠️ 중요: 사용자 ID 제한**
> 현재 스크립트는 포트 번호 생성 로직의 한계로 인해 **`user0`부터 `user9`까지 총 10명**의 사용자만 지원합니다. 약속된 ID를 입력해주세요.
>
> 예시: `user3`

ID를 입력하면, 스크립트는 해당 사용자를 위한 `.env` 파일과 `docker-compose.yaml` 파일을 자동으로 생성합니다.

#### 2단계: Docker 컨테이너 시작

스크립트 실행이 완료된 후, 터미널에 안내된 대로 아래 명령어를 실행하여 모든 서비스를 시작합니다.

```bash
docker compose up --build -d
```

- `--build`: 이미지를 새로 빌드합니다. (코드 변경 시 필수)
- `-d`: 컨테이너를 백그라운드에서 실��합니다.

### 서비스 접속

스크립트 실행이 끝나면 터미널에 각 사용자의 전용 포트 번호가 안내됩니다. 안내된 주소로 접속하세요.

- **투표 앱**: `http://localhost:[MY_FRONTEND_PORT]`
- **결과 대시보드**: `http://localhost:[MY_DASHBOARD_PORT]`
- **API 서버 상태**: `http://localhost:[MY_API_PORT]`

## 5. 환경 종료 및 데이터 삭제

#### 컨테이너 중지 및 삭제

현재 사용자의 환경을 종료하려면 다음 명령어를 실행하세요.

```bash
docker compose down
```
이 명령어는 `.env` 파일에 설정된 `COMPOSE_PROJECT_NAME`을 기준으로 동작하므로, 다른 사용자의 환경에 영향을 주지 않습니다.

#### 데이터베이스 기록 완전 삭제 (필요시)

모든 투표 기록을 완전히 삭제하고 싶다면, `down` 명령어 실행 후 아래 명령어를 추가로 실행하여 Docker 볼륨을 제거하세요.

```bash
docker volume rm <project_name>_postgres_data_<user_id>
```
- 예시: `docker volume rm user3_postgres_data_user3`
- 정확한 볼륨 이름은 `docker volume ls` 명령어로 확인할 수 있습니다.

## 6. 프로젝트 구조

```
.
├── ReadMe.md
├── api-server/      # Node.js 백엔드
├── dashboard/       # React 대시보���
├── database/        # DB 초기화 스크립트
├── docker-compose-template.yaml # Docker Compose 템플릿
├── setup-user-env.sh # 사용자 환경 설정 스크립트
└── voting-app/      # React 투표 앱
```
