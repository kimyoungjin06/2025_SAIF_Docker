#!/bin/bash
# cleanup-k8s-env.sh

# 사용자 ID 입력받기
read -p "정리할 사용자 ID를 입력하세요 (예: user01): " USER_ID

echo "사용자 ${USER_ID}의 Kubernetes 환경을 정리합니다..."

# 네임스페이스 삭제 (모든 리소스가 함께 삭제됨)
kubectl delete namespace ${USER_ID}-voting

# 이미지 삭제 (선택사항)
read -p "Docker 이미지도 삭제하시겠습니까? (y/N): " DELETE_IMAGES
if [[ $DELETE_IMAGES == "y" || $DELETE_IMAGES == "Y" ]]; then
    echo "Docker 이미지 삭제 중..."
    docker rmi ${USER_ID}-voting-api 2>/dev/null || true
    docker rmi ${USER_ID}-voting-app 2>/dev/null || true
    docker rmi ${USER_ID}-voting-dashboard 2>/dev/null || true
fi

# 생성된 매니페스트 파일 삭제
read -p "생성된 매니페스트 파일을 삭제하시겠습니까? (y/N): " DELETE_MANIFESTS
if [[ $DELETE_MANIFESTS == "y" || $DELETE_MANIFESTS == "Y" ]]; then
    rm -rf k8s-generated/
fi

echo ""
echo "${USER_ID} Kubernetes 환경 정리가 완료되었습니다."