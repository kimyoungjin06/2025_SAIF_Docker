#!/bin/bash
# setup-user-env.sh

# 사용자 ID 입력받기
read -p "사용자 ID를 입력하세요 (예: user01): " USER_ID

# 포트 번호 생성 (마지막 2자리 사용)
USER_NUM=$(echo $USER_ID | sed 's/user//')
BASE_PORT="300${USER_NUM}"

FRONTEND_PORT="${BASE_PORT}0"
API_PORT="${BASE_PORT}1"
DASHBOARD_PORT="${BASE_PORT}2"
DB_PORT="${BASE_PORT}3"

# 환경 변수 파일 생성
cat > .env << EOF
USER_ID=${USER_ID}
FRONTEND_PORT=${FRONTEND_PORT}
API_PORT=${API_PORT}
DASHBOARD_PORT=${DASHBOARD_PORT}
DB_PORT=${DB_PORT}
EOF

# docker-compose.yml 생성
envsubst < docker-compose-template.yml > docker-compose.yml

echo "설정 완료!"
echo "투표 앱: http://localhost:${FRONTEND_PORT}"
echo "API: http://localhost:${API_PORT}"
echo "대시보드: http://localhost:${DASHBOARD_PORT}"
echo "데이터베이스: localhost:${DB_PORT}"

# 실행
docker compose up --build