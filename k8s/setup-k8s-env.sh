#!/bin/bash
# setup-k8s-env.sh

# 스크립트가 있는 디렉토리의 부모 디렉토리(프로젝트 루트)로 이동하여 경로 문제를 해결합니다.
cd "$(dirname "$0")/.."

set -e # 스크립트 실행 중 오류 발생 시 즉시 중단

echo "=== Kubernetes 투표 시스템 배포 시작 ==="

# 사용자 ID 입력받기
read -p "사용자 ID를 입력하세요 (예: user0): " USER_ID
if [[ -z "$USER_ID" ]]; then
    echo "오류: 사용자 ID를 입력해야 합니다."
    exit 1
fi

# 1. 환경 변수 설정
echo "1. 환경 변수 설정 중..."
# 포트 번호 생성
USER_NUM=$(echo $USER_ID | sed 's/user//')
BASE_PORT="300${USER_NUM}"

export USER_ID
export FRONTEND_PORT="300${USER_NUM}0"
export API_PORT="300${USER_NUM}1"
export DASHBOARD_PORT="300${USER_NUM}2"

# Minikube IP 가져오기
export MINIKUBE_IP=$(minikube ip)
if [[ -z "$MINIKUBE_IP" ]]; then
    echo "오류: Minikube IP를 가져올 수 없습니다. Minikube가 실행 중인지 확인하세요."
    exit 1
fi
echo "  - Minikube IP: $MINIKUBE_IP"
echo "  - 사용자 포트: $FRONTEND_PORT, $API_PORT, $DASHBOARD_PORT"

# 2. Docker 이미지 빌드
echo "2. Docker 이미지 빌드 중... (Minikube Docker 환경)"
# Minikube의 Docker 데몬을 사용하도록 환경 설정
eval $(minikube -p minikube docker-env)
docker build -t ${USER_ID}-voting-api:latest ./api-server
docker build -t ${USER_ID}-voting-app:latest ./voting-app
docker build -t ${USER_ID}-voting-dashboard:latest ./dashboard
echo "  - 이미지 빌드 완료."

# 3. Kubernetes 매니페스트 생성
echo "3. Kubernetes 매니페스트 생성 중..."
GENERATED_DIR="k8s-generated/${USER_ID}"
mkdir -p "$GENERATED_DIR"

# k8s 디렉토리의 모든 .yaml 파일에 대해 환경 변수 치환
for template in k8s/*.yaml; do
    if [[ -f "$template" ]]; then
        filename=$(basename "$template")
        envsubst < "$template" > "${GENERATED_DIR}/${filename}"
    fi
done
echo "  - 생성된 매니페스트: ${GENERATED_DIR}"

# 4. Kubernetes 리소스 배포
echo "4. Kubernetes 리소스 배포 중..."
echo "  - 네임스페이스를 먼저 생성합니다..."
kubectl apply -f "${GENERATED_DIR}/namespace.yaml"

echo "  - ConfigMap, Secret, PVC를 배포합니다..."
kubectl apply -f "${GENERATED_DIR}/configmap.yaml"
kubectl apply -f "${GENERATED_DIR}/postgres.yaml" # PVC가 여기에 포함되어 있음

echo "  - 나머지 애플리케이션 리소스를 배포합니다..."
kubectl apply -f "$GENERATED_DIR"

echo "  - 모든 리소스를 배포했습니다. Pod가 준비될 때까지 대기합니다."

# 5. 배포 상태 확인
echo "5. 배포 상태 확인 중..."
kubectl wait --for=condition=available --timeout=180s deployment/postgres-deployment -n ${USER_ID}-voting
kubectl wait --for=condition=available --timeout=180s deployment/api-deployment -n ${USER_ID}-voting
kubectl wait --for=condition=available --timeout=180s deployment/frontend-deployment -n ${USER_ID}-voting
kubectl wait --for=condition=available --timeout=180s deployment/dashboard-deployment -n ${USER_ID}-voting

echo ""
echo "=== 🚀 배포 완료! ==="
echo ""
echo "접속 정보:"
echo "  - 투표 앱: http://${MINIKUBE_IP}:${FRONTEND_PORT}"
echo "  - 대시보드: http://${MINIKUBE_IP}:${DASHBOARD_PORT}"
echo "  - API 서버: http://${MINIKUBE_IP}:${API_PORT}"
echo ""
echo "상태 확인 명령어:"
echo "  kubectl get all -n ${USER_ID}-voting"
echo ""
echo "로그 확인 예시:"
echo "  kubectl logs -f deployment/api-deployment -n ${USER_ID}-voting"
echo ""
echo "정리하려면 다음 명령어를 실행하세요:"
echo "  ./k8s/cleanup-k8s-env.sh ${USER_ID}"
echo ""