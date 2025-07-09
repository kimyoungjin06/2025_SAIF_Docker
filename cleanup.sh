#!/bin/bash
# cleanup.sh - 강의 종료 후 정리
docker compose down -v
docker system prune -a -f