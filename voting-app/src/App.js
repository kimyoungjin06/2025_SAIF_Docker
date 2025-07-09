import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedOption, setSelectedOption] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const votingOptions = [
    { id: 'pizza', name: '피자', description: '이탈리안 스타일의 클래식한 선택' },
    { id: 'chicken', name: '치킨', description: '바삭하고 맛있는 한국의 소울푸드' },
    { id: 'burger', name: '버거', description: '든든하고 만족스러운 아메리칸 스타일' },
    { id: 'ramen', name: '라면', description: '따뜻하고 간편한 한 끼 해결사' }
  ];

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    // 환경 변수 또는 기본값 사용
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    try {
      console.log('API URL:', API_URL); // 디버깅용
      console.log('Voting for:', selectedOption);
      
      const response = await fetch(`${API_URL}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option: selectedOption })
      });
      
      const data = await response.json();
      console.log('Vote response:', data);
      
      if (data.success) {
        setHasVoted(true);
      } else {
        alert('투표 실패: ' + data.error);
      }
    } catch (error) {
      console.error('투표 중 오류 발생:', error);
      alert('서버 연결 실패. 시뮬레이션 모드로 전환합니다.');
      // 시뮬레이션 모드
      setTimeout(() => {
        setHasVoted(true);
        setIsSubmitting(false);
      }, 1000);
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetVote = () => {
    setHasVoted(false);
    setSelectedOption('');
  };

  if (hasVoted) {
    const DASHBOARD_URL = process.env.REACT_APP_DASHBOARD_URL || 'http://localhost:3002';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 text-green-500 mx-auto mb-4 text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">투표 완료!</h2>
            <p className="text-gray-600">소중한 의견을 주셔서 감사합니다.</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              선택하신 항목: {votingOptions.find(opt => opt.id === selectedOption)?.name}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.open(DASHBOARD_URL, '_blank')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              📊 실시간 결과 보기
              <span className="text-xs opacity-75">(새 창)</span>
            </button>
            
            <button
              onClick={resetVote}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              다시 투표하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl">🗳️</div>
            <h1 className="text-3xl font-bold text-gray-800">점심 메뉴 투표</h1>
          </div>
          <p className="text-gray-600 text-lg">오늘 점심으로 뭘 먹을까요? 여러분의 선택을 기다립니다!</p>
        </div>

        {/* 투표 옵션들 */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>👥</span>
            투표 옵션을 선택하세요
          </h2>
          
          <div className="space-y-4">
            {votingOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`
                  p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 vote-option
                  ${selectedOption === option.id 
                    ? 'border-purple-500 bg-purple-50 shadow-md' 
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${selectedOption === option.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}
                  `}>
                    {selectedOption === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{option.name}</h3>
                    <p className="text-gray-600 text-sm">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 투표 버튼 */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <button
            onClick={handleVote}
            disabled={!selectedOption || isSubmitting}
            className={`
              w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200
              ${selectedOption && !isSubmitting
                ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                투표 중...
              </div>
            ) : (
              '투표하기'
            )}
          </button>
          
          {!selectedOption && (
            <p className="text-gray-500 text-sm text-center mt-3">
              먼저 옵션을 선택해주세요
            </p>
          )}
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            💡 이 앱은 Docker 컨테이너에서 실행되고 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;