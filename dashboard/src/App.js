import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { RefreshCw, Users, TrendingUp, Clock, Award } from 'lucide-react';

export default function VotingDashboard() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 투표 결과 가져오기
      const resultsResponse = await fetch(`${API_URL}/api/results`);
      const resultsData = await resultsResponse.json();
      
      // 투표 히스토리 가져오기
      const historyResponse = await fetch(`${API_URL}/api/history?limit=20`);
      const historyData = await historyResponse.json();
      
      // 통계 가져오기
      const statsResponse = await fetch(`${API_URL}/api/stats`);
      const statsData = await statsResponse.json();
      
      if (resultsData.success) {
        setResults(resultsData.results);
      }
      
      if (historyData.success) {
        setHistory(historyData.recentVotes);
      }
      
      if (statsData.success) {
        setStats(statsData.statistics);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드 및 자동 새로고침
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5초마다 새로고침
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 유지 (컴포넌트 마운트 시에만 실행)

  // 차트 색상
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // 데이터 포맷팅
  const chartData = results.map(result => ({
    name: result.name,
    count: parseInt(result.count),
    percentage: parseFloat(result.percentage) || 0
  }));

  const pieData = results.map((result, index) => ({
    name: result.name,
    value: parseInt(result.count),
    color: COLORS[index % COLORS.length]
  }));

  // 시간대별 투표 추이 (시뮬레이션)
  const timelineData = [
    { time: '09:00', votes: 12 },
    { time: '10:00', votes: 25 },
    { time: '11:00', votes: 45 },
    { time: '12:00', votes: 78 },
    { time: '13:00', votes: 92 },
    { time: '14:00', votes: 108 },
    { time: '15:00', votes: 125 }
  ];

  const totalVotes = results.reduce((sum, result) => sum + parseInt(result.count), 0);
  const winner = results.length > 0 ? results[0] : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🗳️ 투표 결과 대시보드
              </h1>
              <p className="text-gray-600">
                실시간 투표 현황을 확인하세요
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">마지막 업데이트</p>
                <p className="text-sm font-medium">
                  {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">총 투표 수</p>
                <p className="text-2xl font-bold text-gray-800">{totalVotes}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">참여자 수</p>
                <p className="text-2xl font-bold text-gray-800">{stats.unique_voters || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">1위 항목</p>
                <p className="text-lg font-bold text-gray-800">
                  {winner ? winner.name : '없음'}
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">투표 시작</p>
                <p className="text-sm font-medium text-gray-800">
                  {stats.voting_started_at ? 
                    new Date(stats.voting_started_at).toLocaleDateString() : 
                    '오늘'
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 막대 차트 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 투표 결과 (막대 차트)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 원형 차트 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🍰 투표 비율 (원형 차트)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 시간대별 투표 추이 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📈 시간대별 투표 추이 (Virtual Simulation ;))
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="votes" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 상세 결과 테이블 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 투표 결과 테이블 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 상세 투표 결과
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">순위</th>
                    <th className="px-4 py-2 text-left">항목</th>
                    <th className="px-4 py-2 text-center">투표 수</th>
                    <th className="px-4 py-2 text-center">비율</th>
                    <th className="px-4 py-2 text-center">진행률</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.option} className="border-b">
                      <td className="px-4 py-3 font-medium">
                        {index + 1}
                        {index === 0 && <span className="ml-2">🥇</span>}
                        {index === 1 && <span className="ml-2">🥈</span>}
                        {index === 2 && <span className="ml-2">🥉</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{result.emoji}</span>
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-sm text-gray-500">{result.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {result.count}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {result.percentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 최근 투표 기록 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🕐 최근 투표 기록
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((vote, index) => (
                <div key={vote.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{vote.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{vote.option_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(vote.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">
            💡 이 대시보드는 5초마다 자동으로 업데이트됩니다
          </p>
        </div>
      </div>
    </div>
  );
}