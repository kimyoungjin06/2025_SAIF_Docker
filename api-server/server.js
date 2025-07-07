const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 임시 데이터 저장소 (나중에 데이터베이스로 변경)
let votes = {
  pizza: 0,
  chicken: 0,
  burger: 0,
  ramen: 0
};

// 투표 현황 저장
let voteHistory = [];

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Voting API Server is running!',
    endpoints: {
      vote: 'POST /api/vote',
      results: 'GET /api/results',
      health: 'GET /health'
    }
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 투표 API
app.post('/api/vote', (req, res) => {
  const { option } = req.body;
  
  // 유효성 검사
  if (!option || !votes.hasOwnProperty(option)) {
    return res.status(400).json({ 
      error: 'Invalid vote option',
      validOptions: Object.keys(votes)
    });
  }
  
  // 투표 처리
  votes[option]++;
  
  // 투표 기록 저장
  voteHistory.push({
    option,
    timestamp: new Date().toISOString(),
    ip: req.ip
  });
  
  console.log(`📊 New vote: ${option} (Total: ${votes[option]})`);
  
  res.json({ 
    success: true,
    message: 'Vote recorded successfully',
    option,
    currentCount: votes[option]
  });
});

// 투표 결과 조회 API
app.get('/api/results', (req, res) => {
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  
  const results = Object.entries(votes).map(([option, count]) => ({
    option,
    count,
    percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
  }));
  
  res.json({
    success: true,
    totalVotes,
    results,
    lastUpdate: new Date().toISOString()
  });
});

// 투표 기록 조회 API (관리자용)
app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const recentVotes = voteHistory.slice(-limit).reverse();
  
  res.json({
    success: true,
    totalVotes: voteHistory.length,
    recentVotes
  });
});

// 투표 초기화 API (개발용)
app.post('/api/reset', (req, res) => {
  votes = {
    pizza: 0,
    chicken: 0,
    burger: 0,
    ramen: 0
  };
  voteHistory = [];
  
  console.log('🔄 Votes reset');
  
  res.json({ 
    success: true,
    message: 'All votes have been reset'
  });
});

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/vote',
      'GET /api/results',
      'GET /api/history',
      'POST /api/reset'
    ]
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server is running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🗳️  Vote endpoint: http://localhost:${PORT}/api/vote`);
  console.log(`📊 Results endpoint: http://localhost:${PORT}/api/results`);
});