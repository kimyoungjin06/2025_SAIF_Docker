const express = require('express');
const router = express.Router();

// vote.js에서 데이터 가져오기
const { votes } = require('./vote');

// 투표 결과 조회 API
router.get('/', (req, res) => {
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

module.exports = router;