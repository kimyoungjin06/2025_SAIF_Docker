const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// PostgreSQL 연결 설정
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voting_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'voting_password_123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 데이터베이스 연결 테스트
async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

// 서버 시작 시 DB 연결 테스트
testDatabaseConnection();

// 기본 라우트
app.get('/', async (req, res) => {
  try {
    const stats = await pool.query('SELECT * FROM get_vote_statistics()');
    res.json({ 
      message: 'Voting API Server with PostgreSQL is running!',
      database: 'connected',
      statistics: stats.rows[0] || {},
      endpoints: {
        vote: 'POST /api/vote',
        results: 'GET /api/results',
        history: 'GET /api/history',
        stats: 'GET /api/stats',
        health: 'GET /health'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'API Server running but database query failed',
      error: error.message
    });
  }
});

// 헬스 체크 (헬스체크용)
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      timestamp: result.rows[0].now,
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// 투표 API
app.post('/api/vote', async (req, res) => {
  const { option } = req.body;
  const voterIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const sessionId = req.headers['x-session-id'] || uuidv4();
  
  try {
    // 트랜잭션 시작
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 유효한 옵션인지 확인
      const validOptions = await client.query(
        'SELECT option_key FROM vote_options WHERE option_key = $1',
        [option]
      );
      
      if (validOptions.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false,
          error: 'Invalid vote option',
          validOptions: ['pizza', 'chicken', 'burger', 'ramen']
        });
      }
      
      // 투표 기록 저장
      await client.query(
        'INSERT INTO votes (option_key, voter_ip, user_agent, session_id) VALUES ($1, $2, $3, $4)',
        [option, voterIp, userAgent, sessionId]
      );
      
      // 세션 정보 업데이트
      await client.query(`
        INSERT INTO voting_sessions (session_id, voter_ip, last_vote_at, vote_count)
        VALUES ($1, $2, NOW(), 1)
        ON CONFLICT (session_id) 
        DO UPDATE SET 
          last_vote_at = NOW(),
          vote_count = voting_sessions.vote_count + 1
      `, [sessionId, voterIp]);
      
      // 현재 투표 수 조회
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM votes WHERE option_key = $1',
        [option]
      );
      
      await client.query('COMMIT');
      
      const currentCount = parseInt(countResult.rows[0].count);
      
      console.log(`📊 New vote: ${option} (Total: ${currentCount}) from IP: ${voterIp}`);
      
      res.json({ 
        success: true,
        message: 'Vote recorded successfully',
        option,
        currentCount,
        sessionId
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vote',
      message: error.message
    });
  }
});

// 투표 결과 조회 API
app.get('/api/results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        vo.option_key as option,
        vo.option_name as name,
        vo.description,
        vo.emoji,
        COUNT(v.id) as count,
        ROUND(COUNT(v.id) * 100.0 / NULLIF(SUM(COUNT(v.id)) OVER(), 0), 2) as percentage,
        MAX(v.created_at) as last_vote_time
      FROM vote_options vo
      LEFT JOIN votes v ON vo.option_key = v.option_key
      GROUP BY vo.option_key, vo.option_name, vo.description, vo.emoji
      ORDER BY count DESC
    `);
    
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM votes');
    const totalVotes = parseInt(totalResult.rows[0].total);
    
    res.json({
      success: true,
      totalVotes,
      results: result.rows,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch results',
      message: error.message
    });
  }
});

// 투표 기록 조회 API
app.get('/api/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await pool.query(`
      SELECT 
        v.id,
        v.option_key,
        vo.option_name,
        vo.emoji,
        v.voter_ip,
        v.created_at
      FROM votes v 
      JOIN vote_options vo ON v.option_key = vo.option_key 
      ORDER BY v.created_at DESC 
      LIMIT $1
    `, [limit]);
    
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM votes');
    const totalVotes = parseInt(totalResult.rows[0].total);
    
    res.json({
      success: true,
      totalVotes,
      recentVotes: result.rows
    });
    
  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

// 통계 API
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query('SELECT * FROM get_vote_statistics()');
    const hourlyStats = await pool.query(`
      SELECT * FROM hourly_vote_stats 
      WHERE hour >= NOW() - INTERVAL '24 hours'
      ORDER BY hour DESC
    `);
    
    res.json({
      success: true,
      statistics: stats.rows[0] || {},
      hourlyStats: hourlyStats.rows,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// 투표 초기화 API (관리자용)
app.post('/api/reset', async (req, res) => {
  try {
    await pool.query('SELECT reset_votes()');
    
    console.log('🔄 All votes reset');
    
    res.json({ 
      success: true,
      message: 'All votes have been reset'
    });
    
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset votes',
      message: error.message
    });
  }
});

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/vote',
      'GET /api/results',
      'GET /api/history',
      'GET /api/stats',
      'POST /api/reset'
    ]
  });
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server with PostgreSQL is running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🗳️  Vote endpoint: http://localhost:${PORT}/api/vote`);
  console.log(`📊 Results endpoint: http://localhost:${PORT}/api/results`);
  console.log(`📈 Statistics endpoint: http://localhost:${PORT}/api/stats`);
});

// graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully');
  pool.end(() => {
    console.log('💾 Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully');
  pool.end(() => {
    console.log('💾 Database pool closed');
    process.exit(0);
  });
});