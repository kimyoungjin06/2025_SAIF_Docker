#!/bin/bash
# setup-k8s-env.sh

echo "=== Kubernetes 투표 시스템 배포 ==="

# 사용자 ID 입력받기
read -p "사용자 ID를 입력하세요 (예: user01): " USER_ID

# 포트 번호 생성
USER_NUM=$(echo $USER_ID | sed 's/user//')
BASE_PORT="300${USER_NUM}"

export FRONTEND_PORT="${BASE_PORT}0"
export API_PORT="${BASE_PORT}1"
export DASHBOARD_PORT="${BASE_PORT}2"
export DB_PORT="${BASE_PORT}3"

# 1. Docker 이미지 빌드
echo "1. Docker 이미지 빌드 중..."
docker build -t ${USER_ID}-voting-api ./api-server
docker build -t ${USER_ID}-voting-app ./voting-app
docker build -t ${USER_ID}-voting-dashboard ./dashboard

# 2. Kubernetes 매니페스트 생성
echo "2. Kubernetes 매니페스트 생성 중..."
mkdir -p k8s-generated

# 환경 변수 치환하여 매니페스트 생성
for file in k8s/*.yaml; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        envsubst < "$file" > "k8s-generated/$filename"
    fi
done

# 3. 네임스페이스 생성
echo "3. 네임스페이스 생성..."
kubectl apply -f k8s-generated/namespace.yaml

# 4. ConfigMap과 Secret 생성
echo "4. ConfigMap과 Secret 생성..."
kubectl apply -f k8s-generated/configmap.yaml

# 5. PostgreSQL 초기화 SQL을 ConfigMap으로 생성
echo "5. PostgreSQL 초기화 ConfigMap 생성..."
kubectl create configmap postgres-init-sql \
    --from-file=01-init.sql=./database/init.sql \
    --namespace=${USER_ID}-voting \
    --dry-run=client -o yaml | kubectl apply -f -

# 6. 서비스 배포
echo "6. 서비스 배포 중..."
kubectl apply -f k8s-generated/postgres.yaml
echo "PostgreSQL 시작 대기 중..."
kubectl wait --for=condition=ready pod -l app=postgres --namespace=${USER_ID}-voting --timeout=60s

kubectl apply -f k8s-generated/api-server.yaml
echo "API 서버 시작 대기 중..."
kubectl wait --for=condition=ready pod -l app=voting-api --namespace=${USER_ID}-voting --timeout=60s

kubectl apply -f k8s-generated/frontend.yaml
kubectl apply -f k8s-generated/dashboard.yaml

echo "프론트엔드 서비스 시작 대기 중..."
kubectl wait --for=condition=ready pod -l app=voting-frontend --namespace=${USER_ID}-voting --timeout=60s

echo ""
echo "=== 배포 완료! ==="
echo "접속 정보:"
echo "  - 투표 앱: http://localhost:${FRONTEND_PORT}"
echo "  - 대시보드: http://localhost:${DASHBOARD_PORT}"
echo "  - API 서버: http://localhost:${API_PORT}"
echo "  - 데이터베이스: localhost:${DB_PORT}"
echo ""
echo "Kubernetes 리소스 확인:"
echo "kubectl get all --namespace=${USER_ID}-voting"
echo ""
echo "Pod 로그 확인:"
echo "kubectl logs -f deployment/api-deployment --namespace=${USER_ID}-voting"
echo ""
echo "정리하려면 다음 명령어를 실행하세요:"
echo "./cleanup-k8s-env.sh"