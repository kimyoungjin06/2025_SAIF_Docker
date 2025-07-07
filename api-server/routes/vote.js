const express = require('express');
const router = express.Router();

// 임시 데이터 저장소 (나중에 데이터베이스로 변경)
let votes = {
  pizza: 0,
  chicken: 0,
  burger: 0,
  ramen: 0
};

// 투표 현황 저장
let voteHistory = [];

// 투표 API
router.post('/', (req, res) => {
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

// 투표 초기화 API (개발용)
router.post('/reset', (req, res) => {
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

// 투표 기록 조회 API (관리자용)
router.get('/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const recentVotes = voteHistory.slice(-limit).reverse();
  
  res.json({
    success: true,
    totalVotes: voteHistory.length,
    recentVotes
  });
});

// votes와 voteHistory를 다른 모듈에서 사용할 수 있도록 export
module.exports = { router, votes, voteHistory };