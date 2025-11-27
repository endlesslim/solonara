import React, { useState, useEffect } from 'react';
import { QUESTION_POOL } from './constants';
import { Option, UserTraits, CharacterProfile, Question } from './types';
import { analyzePersonality, analyzeMatch, generateCharacterPortrait } from './services/gemini';
import TraitRadar from './components/RadarChart';
import { Loader2, Heart, Share2, RefreshCw, UserPlus, Sparkles, Image as ImageIcon, ThumbsUp, ThumbsDown, AlertTriangle, User, Users, Lightbulb, TrendingUp, Target } from 'lucide-react';

enum AppState {
  WELCOME,
  GENDER_SELECT,
  QUIZ,
  ANALYZING,
  RESULT,
  MATCH_CHECK
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [traits, setTraits] = useState<UserTraits>({ aggressiveness: 0, empathy: 0, realism: 0, humor: 0, style: 0 });
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [result, setResult] = useState<CharacterProfile | null>(null);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [idealPartnerImage, setIdealPartnerImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Match State
  const [partnerName, setPartnerName] = useState("");
  const [matchResult, setMatchResult] = useState<{matchScore: number, scenario: string, verdict: string} | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleAnswer = (option: Option) => {
    // Accumulate scores
    setTraits(prev => ({
      aggressiveness: prev.aggressiveness + option.traits[0],
      empathy: prev.empathy + option.traits[1],
      realism: prev.realism + option.traits[2],
      humor: prev.humor + option.traits[3],
      style: prev.style + option.traits[4],
    }));

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setAppState(AppState.ANALYZING);
  };

  // Initial Analysis Effect
  useEffect(() => {
    if (appState === AppState.ANALYZING) {
      performAnalysis();
    }
  }, [appState]); // Only trigger on state change to ANALYZING

  const performAnalysis = async () => {
    if (!gender) return; // Should not happen
    
    try {
      // 1. Generate Text Profile
      const profile = await analyzePersonality(traits, gender);
      setResult(profile);
      setAppState(AppState.RESULT);
      setIsRegenerating(false);

      // 2. Generate Images (Parallel)
      if (profile.visualDescription) {
        setIsGeneratingImage(true);
        setCharacterImage(null); // Reset
        setIdealPartnerImage(null); // Reset

        // Trigger both image generations
        const imagePromises = [
          generateCharacterPortrait(profile.visualDescription, gender),
          profile.idealPartnerVisualDescription 
            ? generateCharacterPortrait(profile.idealPartnerVisualDescription, gender === 'male' ? 'female' : 'male') 
            : Promise.resolve(undefined)
        ];

        const [myImg, partnerImg] = await Promise.all(imagePromises);
        
        if (myImg) setCharacterImage(myImg);
        if (partnerImg) setIdealPartnerImage(partnerImg);
        
        setIsGeneratingImage(false);
      }
    } catch (e) {
      console.error(e);
      setAppState(AppState.RESULT); // Fallback
    }
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    // Directly call analysis without changing main app state to ANALYZING to keep UI context or show a specific loader
    performAnalysis(); 
  };

  const handleMatchCheck = async () => {
    if (!partnerName || !result) return;
    setIsMatching(true);
    const matchData = await analyzeMatch(result, partnerName);
    setMatchResult(matchData);
    setIsMatching(false);
  };

  const restart = () => {
    setTraits({ aggressiveness: 0, empathy: 0, realism: 0, humor: 0, style: 0 });
    setCurrentQuestionIdx(0);
    setQuestions([]);
    setResult(null);
    setCharacterImage(null);
    setIdealPartnerImage(null);
    setMatchResult(null);
    setPartnerName("");
    setGender(null);
    setAppState(AppState.WELCOME);
  };

  const selectGender = (selectedGender: 'male' | 'female') => {
    setGender(selectedGender);
    
    // Randomly select 7 questions from the pool
    const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
    setQuestions(shuffled.slice(0, 7));
    
    setAppState(AppState.QUIZ);
  };

  // --- Views ---

  if (appState === AppState.WELCOME) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="glass-card p-10 rounded-3xl max-w-md w-full text-center animate-slide-up border-4 border-white">
          <div className="mb-8 flex justify-center">
             <div className="bg-gradient-to-tr from-rose-400 to-pink-600 text-white font-black text-4xl w-28 h-28 flex items-center justify-center rounded-full shadow-2xl transform -rotate-6 border-4 border-white">
               SOLO
             </div>
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-tight leading-tight">나도<br/><span className="text-rose-500">솔로나라</span>에<br/>나간다면?</h1>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            AI가 분석하는 나의 연애 페르소나.<br/>
            <span className="font-bold text-gray-800">나는 몇 기, 어떤 이름일까?</span>
          </p>
          <button 
            onClick={() => setAppState(AppState.GENDER_SELECT)}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl text-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-3"
          >
            <Heart className="fill-rose-500 text-rose-500" /> 테스트 시작하기
          </button>
          <div className="mt-6 text-xs text-gray-400 font-medium">Powered by Gemini 3.0 Pro</div>
        </div>
      </div>
    );
  }

  if (appState === AppState.GENDER_SELECT) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="glass-card p-8 rounded-3xl max-w-md w-full text-center animate-fade-in border-4 border-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">성별을 선택해주세요</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => selectGender('male')}
              className="flex-1 flex flex-col items-center justify-center gap-4 py-8 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-2xl transition-all active:scale-95 group"
            >
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <span className="text-lg font-bold text-blue-700">남자 출연자</span>
            </button>
            <button 
              onClick={() => selectGender('female')}
              className="flex-1 flex flex-col items-center justify-center gap-4 py-8 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 rounded-2xl transition-all active:scale-95 group"
            >
              <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <span className="text-lg font-bold text-rose-700">여자 출연자</span>
            </button>
          </div>
          <button 
            onClick={() => setAppState(AppState.WELCOME)}
            className="mt-8 text-gray-400 text-sm hover:text-gray-600 underline"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (appState === AppState.QUIZ) {
    const question = questions[currentQuestionIdx];
    // Safety check in case questions aren't loaded yet
    if (!question) return null; 
    
    const progress = ((currentQuestionIdx + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen flex flex-col items-center pt-12 p-6 bg-gray-50">
        <div className="max-w-md w-full animate-fade-in">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="glass-card p-8 rounded-3xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-300 to-pink-500"></div>
            <span className="text-rose-500 font-black text-sm tracking-widest uppercase mb-2 block">Question {currentQuestionIdx + 1}</span>
            <h2 className="text-2xl font-bold text-gray-800 leading-snug">
              {question.text}
            </h2>
          </div>

          <div className="space-y-4">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAnswer(opt)}
                className="w-full p-5 bg-white border-2 border-transparent hover:border-rose-400 hover:bg-rose-50 rounded-2xl text-left text-gray-700 font-medium transition-all active:scale-95 shadow-md hover:shadow-lg group"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold mr-3 group-hover:bg-rose-500 group-hover:text-white transition-colors">{opt.id}</span> 
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (appState === AppState.ANALYZING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white/90 p-6 text-center backdrop-blur-sm">
        <div className="relative">
            <div className="absolute inset-0 bg-rose-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="w-20 h-20 text-rose-500 animate-spin relative z-10" />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mt-8 mb-3">분석 중...</h2>
        <p className="text-gray-500 text-lg animate-pulse">솔로나라 제작진이 당신의 프로필을<br/>작성하고 있습니다.</p>
      </div>
    );
  }

  // RESULT & MATCH VIEW
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Background */}
      <div className="bg-gradient-to-b from-rose-500 to-pink-600 pb-32 pt-12 px-6 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <h1 className="text-white text-center font-bold text-xl opacity-90 relative z-10 flex items-center justify-center gap-2">
            <Sparkles size={18} /> 당신의 캐릭터
        </h1>
      </div>

      <div className="max-w-md mx-auto -mt-24 px-6 animate-slide-up">
        {/* Main Card */}
        <div className="glass-card rounded-3xl overflow-hidden mb-8 relative border-t-4 border-rose-300">
          {isRegenerating && (
             <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity">
                <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
                <p className="text-rose-600 font-bold animate-pulse text-lg">새로운 캐릭터 리빌딩 중...</p>
             </div>
          )}

          <div className="p-8 text-center">
             <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight mt-4">{result?.name}</h2>
             <p className="text-rose-500 font-bold text-lg italic mb-8 relative inline-block">
                <span className="absolute -top-4 -left-2 text-4xl text-rose-200 opacity-50">"</span>
                {result?.catchphrase}
                <span className="absolute -bottom-6 -right-2 text-4xl text-rose-200 opacity-50">"</span>
             </p>
             
             {/* Character Image Area */}
             <div className="relative w-56 h-56 mx-auto mb-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gray-100 flex items-center justify-center group transform transition-transform hover:scale-[1.02]">
                {isGeneratingImage ? (
                  <div className="flex flex-col items-center text-gray-400 bg-gray-50 w-full h-full justify-center">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-rose-300" />
                    <span className="text-sm font-medium">초상화 그리는 중...</span>
                  </div>
                ) : characterImage ? (
                  <>
                      <img src={characterImage} alt="Character" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-xs">이미지 없음</span>
                  </div>
                )}
             </div>

             <div className="bg-gradient-to-br from-gray-50 to-rose-50 rounded-2xl p-6 mb-8 text-gray-700 leading-relaxed text-left border border-rose-100 shadow-inner">
               <span className="font-black text-rose-400 text-xl mr-2 float-left leading-none">“</span>
               {result?.description}
             </div>

             <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Personality Radar</h4>
                <TraitRadar traits={traits} />
             </div>

             {/* Prominent Strengths & Weaknesses Section */}
             <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="bg-green-50/80 backdrop-blur-sm rounded-2xl p-5 border border-green-200 shadow-sm relative overflow-hidden text-left">
                   <div className="absolute -right-4 -top-4 opacity-10">
                      <Sparkles size={100} className="text-green-600" />
                   </div>
                   <h4 className="flex items-center gap-2 font-bold text-green-800 text-lg mb-3">
                      <div className="p-1.5 bg-green-200 rounded-lg"><ThumbsUp size={18} className="text-green-700" /></div>
                      입덕 포인트
                   </h4>
                   <ul className="space-y-2 relative z-10">
                      {result?.strengths?.map((s, i) => (
                         <li key={i} className="flex items-start gap-2 text-gray-800 font-medium text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 shadow-sm"></span>
                            {s}
                         </li>
                      ))}
                   </ul>
                </div>

                <div className="bg-rose-50/80 backdrop-blur-sm rounded-2xl p-5 border border-rose-200 shadow-sm relative overflow-hidden text-left">
                   <div className="absolute -right-4 -top-4 opacity-10">
                      <AlertTriangle size={100} className="text-rose-600" />
                   </div>
                   <h4 className="flex items-center gap-2 font-bold text-rose-800 text-lg mb-3">
                      <div className="p-1.5 bg-rose-200 rounded-lg"><ThumbsDown size={18} className="text-rose-700" /></div>
                      탈락 위기
                   </h4>
                   <ul className="space-y-2 relative z-10">
                      {result?.weaknesses?.map((w, i) => (
                         <li key={i} className="flex items-start gap-2 text-gray-800 font-medium text-sm">
                            <span className="mt-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0 shadow-sm"></span>
                            {w}
                         </li>
                      ))}
                   </ul>
                </div>
             </div>

             {/* Strategy Section */}
             <div className="bg-slate-800 text-white rounded-2xl p-6 mb-6 relative overflow-hidden text-left shadow-xl">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Lightbulb size={140} />
                </div>
                
                <h3 className="flex items-center gap-2 font-black text-xl mb-6 text-yellow-400">
                   <Lightbulb className="fill-yellow-400 text-yellow-400" size={24} /> 
                   솔로나라 공략집
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 relative overflow-hidden group">
                      <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase mb-2">
                         <Target size={14} /> 추천 이성
                      </div>
                      <div className="font-bold text-lg text-white leading-tight mb-2">
                         {result?.idealPartner || "알 수 없음"}
                      </div>
                      {idealPartnerImage && (
                          <div className="w-full h-24 bg-gray-600 rounded-lg overflow-hidden relative">
                             <img src={idealPartnerImage} alt="Ideal Partner" className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                          </div>
                      )}
                   </div>
                   <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 flex flex-col justify-center">
                      <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase mb-2">
                         <TrendingUp size={14} /> 커플 확률
                      </div>
                      <div className="font-black text-4xl text-rose-400 leading-none">
                         {result?.successRate || 0}<span className="text-xl text-rose-300">%</span>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                   <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase mb-2">
                      <Sparkles size={14} /> 필승 전략
                   </div>
                   <p className="text-slate-200 text-sm leading-relaxed">
                      {result?.strategy}
                   </p>
                </div>
             </div>

          </div>
          
          <div className="bg-gray-900 p-6 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-2">Famous Line</p>
            <p className="text-white font-medium text-lg">"{result?.famousLine}"</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-10">
           <button 
             onClick={restart} 
             className="flex-1 py-4 bg-white/80 backdrop-blur border border-white text-gray-600 rounded-2xl font-bold shadow-lg flex flex-col items-center justify-center gap-1 hover:bg-white text-xs active:scale-95 transition-all"
           >
             <RefreshCw size={20} className="mb-1" /> 처음으로
           </button>
           
           <button 
             onClick={handleRegenerate} 
             className="flex-1 py-4 bg-white/80 backdrop-blur border border-white text-indigo-600 rounded-2xl font-bold shadow-lg flex flex-col items-center justify-center gap-1 hover:bg-indigo-50 text-xs active:scale-95 transition-all"
             disabled={isRegenerating}
           >
             <Sparkles size={20} className="mb-1" /> 다시 분석
           </button>

           <button 
             onClick={() => alert("URL이 복사되었습니다!")} 
             className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 flex flex-col items-center justify-center gap-1 hover:bg-rose-600 text-xs active:scale-95 transition-all"
           >
             <Share2 size={20} className="mb-1" /> 공유하기
           </button>
        </div>

        {/* Match Section */}
        <div className="glass-card rounded-3xl p-8 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <UserPlus size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-500">
                <UserPlus size={24} />
            </div>
            <div>
                <h3 className="font-bold text-xl text-gray-800">친구와의 궁합</h3>
                <p className="text-xs text-gray-500">내 캐릭터와 친구 캐릭터의 케미는?</p>
            </div>
          </div>
          
          {!matchResult ? (
            <div className="space-y-4 relative z-10">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="친구 이름 입력 (예: 16기 상철)"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-gray-700"
                />
                <button 
                  onClick={handleMatchCheck}
                  disabled={isMatching || !partnerName}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-lg"
                >
                  {isMatching ? <Loader2 className="animate-spin" /> : "확인"}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in relative z-10">
               <div className="flex justify-between items-center mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                 <div className="text-center w-1/3">
                   <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">ME</span>
                   <span className="font-bold text-gray-800 truncate block px-1">{result?.baseName}</span>
                 </div>
                 <div className="flex flex-col items-center w-1/3">
                   <Heart className="fill-rose-500 text-rose-500 drop-shadow-md animate-pulse" size={32} />
                   <span className="font-black text-rose-500 text-2xl mt-1">{matchResult.matchScore}%</span>
                 </div>
                 <div className="text-center w-1/3">
                   <span className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">YOU</span>
                   <span className="font-bold text-gray-800 truncate block px-1">{partnerName}</span>
                 </div>
               </div>
               
               <div className="bg-rose-50/50 rounded-xl p-5 text-sm text-gray-700 mb-4 border border-rose-100">
                 <p className="font-bold text-rose-700 mb-2 flex items-center gap-2">
                    <Sparkles size={14} /> 랜덤 데이트 시뮬레이션
                 </p>
                 <p className="leading-relaxed opacity-90">{matchResult.scenario}</p>
               </div>
               <div className="text-center">
                    <span className="inline-block bg-gray-900 text-white text-xs px-3 py-1 rounded-full font-bold mb-1">최종 판결</span>
                    <p className="font-bold text-gray-800 text-lg">
                        {matchResult.verdict}
                    </p>
               </div>
               
               <button 
                onClick={() => { setMatchResult(null); setPartnerName(""); }}
                className="w-full mt-6 text-xs text-gray-400 hover:text-rose-500 underline transition-colors"
               >
                 다른 친구와 다시 확인하기
               </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}