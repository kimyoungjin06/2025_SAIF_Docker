-- 투표 옵션 테이블
CREATE TABLE IF NOT EXISTS vote_options (
    id SERIAL PRIMARY KEY,
    option_key VARCHAR(50) UNIQUE NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 투표 기록 테이블
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    option_key VARCHAR(50) NOT NULL,
    voter_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_key) REFERENCES vote_options(option_key)
);

-- 투표 집계 뷰 (성능 최적화)
CREATE OR REPLACE VIEW vote_results AS
SELECT 
    vo.option_key,
    vo.option_name,
    vo.description,
    COUNT(v.id) as vote_count,
    ROUND(
        COUNT(v.id) * 100.0 / NULLIF(SUM(COUNT(v.id)) OVER(), 0), 
        2
    ) as percentage
FROM vote_options vo
LEFT JOIN votes v ON vo.option_key = v.option_key
GROUP BY vo.option_key, vo.option_name, vo.description
ORDER BY vote_count DESC;

-- 초기 데이터 삽입
INSERT INTO vote_options (option_key, option_name, description) VALUES
('pizza', '🍕 피자', '이탈리안 스타일의 클래식한 선택'),
('chicken', '🍗 치킨', '바삭하고 맛있는 한국의 소울푸드'),
('burger', '🍔 버거', '든든하고 만족스러운 아메리칸 스타일'),
('ramen', '🍜 라면', '따뜻하고 간편한 한 끼 해결사')
ON CONFLICT (option_key) DO NOTHING;

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_votes_option_key ON votes(option_key);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);