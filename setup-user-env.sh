#!/bin/bash
# setup-user-env.sh

# 사용자 ID 입력받기
read -p "사용자 ID를 입력하세요 (예: user01): " USER_ID

# 포트 번호 생성 (마지막 2자리 사용)
USER_NUM=$(echo $USER_ID | sed 's/user//')
BASE_PORT="300${USER_NUM}"

export FRONTEND_PORT="${BASE_PORT}0"
export API_PORT="${BASE_PORT}1"
export DASHBOARD_PORT="${BASE_PORT}2"
export DB_PORT="${BASE_PORT}3"

# 환경 변수 파일 생성
cat > .env << EOF
COMPOSE_PROJECT_NAME=${USER_ID}
USER_ID=${USER_ID}
FRONTEND_PORT=${FRONTEND_PORT}
API_PORT=${API_PORT}
DASHBOARD_PORT=${DASHBOARD_PORT}
DB_PORT=${DB_PORT}
EOF

# docker-compose.yaml 생성
envsubst < docker-compose-template.yaml > docker-compose.yaml

echo "
환경 설정 파일(.env, docker-compose.yaml) 생성이 완료되었습니다.
아래 명령어를 실행하여 컨테이너를 시작하세요.

docker compose up --build -d

---
접속 정보:
  - 투표 앱: http://localhost:${FRONTEND_PORT}
  - 대시보드: http://localhost:${DASHBOARD_PORT}
  - API 서버: http://localhost:${API_PORT}
"