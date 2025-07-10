-- database/init.sql (완전 수정 버전)
-- 투표 옵션 테이블
CREATE TABLE IF NOT EXISTS vote_options (
    id SERIAL PRIMARY KEY,
    option_key VARCHAR(50) UNIQUE NOT NULL,
    option_name VARCHAR(100) NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 투표 기록 테이블
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    option_key VARCHAR(50) NOT NULL,
    voter_ip INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_key) REFERENCES vote_options(option_key) ON DELETE CASCADE
);

-- 투표 세션 테이블 (누락된 테이블!)
CREATE TABLE IF NOT EXISTS voting_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    voter_ip INET,
    last_vote_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 투표 결과 뷰
CREATE OR REPLACE VIEW vote_results AS
SELECT 
    vo.option_key,
    vo.option_name,
    vo.description,
    vo.emoji,
    COUNT(v.id) as vote_count,
    ROUND(
        COUNT(v.id) * 100.0 / NULLIF(SUM(COUNT(v.id)) OVER(), 0), 
        2
    ) as percentage
FROM vote_options vo
LEFT JOIN votes v ON vo.option_key = v.option_key
GROUP BY vo.option_key, vo.option_name, vo.description, vo.emoji
ORDER BY vote_count DESC;

-- 투표 통계 함수
CREATE OR REPLACE FUNCTION get_vote_statistics()
RETURNS TABLE (
  total_votes BIGINT,
  unique_voters BIGINT,
  total_sessions BIGINT,
  most_voted_option TEXT,
  most_voted_count BIGINT
)
LANGUAGE SQL
AS $$
  SELECT 
    (SELECT COUNT(*) FROM votes) AS total_votes,
    (SELECT COUNT(DISTINCT voter_ip) FROM votes) AS unique_voters,
    (SELECT COUNT(*) FROM voting_sessions) AS total_sessions,
    (SELECT option_key FROM votes GROUP BY option_key ORDER BY COUNT(*) DESC LIMIT 1) AS most_voted_option,
    (SELECT COUNT(*) FROM votes WHERE option_key = (
        SELECT option_key FROM votes GROUP BY option_key ORDER BY COUNT(*) DESC LIMIT 1
    )) AS most_voted_count;
$$;

-- 최근 24시간 시간대별 투표 수
CREATE OR REPLACE VIEW hourly_vote_stats AS
SELECT 
  date_trunc('hour', created_at) AS hour,
  option_key,
  COUNT(*) AS vote_count
FROM votes
WHERE created_at >= NOW() - INTERVAL '2 days' -- 넉넉히 잡기
GROUP BY hour, option_key
ORDER BY hour DESC;



-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_votes_option_key ON votes(option_key);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_voter_ip ON votes(voter_ip);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_session_id ON voting_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_ip ON voting_sessions(voter_ip);

-- 초기 데이터 삽입
INSERT INTO vote_options (option_key, option_name, description, emoji) VALUES
('pizza', '피자', '이탈리안 스타일의 클래식한 선택', '🍕'),
('chicken', '치킨', '바삭하고 맛있는 한국의 소울푸드', '🍗'),
('burger', '버거', '든든하고 만족스러운 아메리칸 스타일', '🍔'),
('ramen', '라면', '따뜻하고 간편한 한 끼 해결사', '🍜')
ON CONFLICT (option_key) DO UPDATE SET
    option_name = EXCLUDED.option_name,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji;

-- 확인
SELECT 'Database initialized with ' || COUNT(*) || ' vote options' as message FROM vote_options;
