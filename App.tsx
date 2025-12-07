import React, { useState, useEffect } from 'react';
import { getMovieRecommendations } from './services/geminiService';
import MovieCard from './components/MovieCard';
import HistorySidebar from './components/HistorySidebar';
import { Movie, LoadingState, SearchHistoryItem } from './types';

// Simple UUID generator for browser
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

function App() {
  const [mood, setMood] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [summary, setSummary] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [progress, setProgress] = useState(0); // Percentage 0-100
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 'home' or 'results'
  const [view, setView] = useState<'home' | 'results'>('home');

  // Filters
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const filters = ['All', 'Movies', 'Miniseries', 'Hidden Gems', 'Award Winning'];

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('flixpix_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history
  useEffect(() => {
    localStorage.setItem('flixpix_history', JSON.stringify(history));
  }, [history]);

  // Loading Progress Logic
  useEffect(() => {
    let interval: any;
    if (loadingState === LoadingState.LOADING) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90%
          if (prev >= 90) return prev; 
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 99);
        });
      }, 300);
    } else if (loadingState === LoadingState.SUCCESS) {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loadingState]);

  const handleSearch = async (overrideMood?: string) => {
    const searchMood = overrideMood || mood;
    if (!searchMood.trim()) return;

    // Check for API Key presence
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setErrorMessage("API Key is missing. Please configure GEMINI_API_KEY in your .env file or build settings.");
      setLoadingState(LoadingState.ERROR);
      return;
    }

    setLoadingState(LoadingState.LOADING);
    setErrorMessage('');
    setSummary(''); 
    setMovies([]);
    
    // Add active filter to search context if specific
    const filterContext = activeFilter !== 'All' ? `Strictly prefer: ${activeFilter}` : '';

    try {
      const data = await getMovieRecommendations(searchMood, filterContext);
      
      setMovies(data.movies);
      setSummary(data.summary);
      
      // Artificial delay to show 100% completion if API is too fast
      setTimeout(() => {
        setLoadingState(LoadingState.SUCCESS);
        setView('results'); // Switch view
        
        // Add to history
        const newItem: SearchHistoryItem = {
          id: generateId(),
          mood: searchMood,
          timestamp: Date.now(),
          results: data.movies
        };
        setHistory(prev => [newItem, ...prev].slice(0, 20));
      }, 500);

    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
      setErrorMessage("Something went wrong while fetching recommendations. Please try again.");
    }
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setMood(item.mood);
    setMovies(item.results);
    setSummary(`Back to the vibe from ${new Date(item.timestamp).toLocaleDateString()}...`);
    setLoadingState(LoadingState.SUCCESS);
    setView('results');
  };

  const handleSurpriseMe = () => {
    const randomVibes = [
      "A visually stunning sci-fi that makes me think",
      "A gritty 90s crime thriller",
      "Something wholesome and animated to cheer me up",
      "A psychological horror that isn't too scary",
      "An underrated indie comedy"
    ];
    const random = randomVibes[Math.floor(Math.random() * randomVibes.length)];
    setMood(random);
    handleSearch(random);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMood(transcript);
      handleSearch(transcript);
    };

    recognition.start();
  };

  const handleShare = async () => {
    const shareText = `🎬 FlixPix Vibe: "${mood}"\n\n${movies.map(m => `• ${m.title} (${m.year}) ⭐ ${m.imdbScore}`).join('\n')}\n\nFind your next watch here: ${window.location.href}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FlixPix Recommendations',
          text: shareText,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const resetSearch = () => {
    setView('home');
    setLoadingState(LoadingState.IDLE);
    setMood('');
    setProgress(0);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl z-[60] animate-bounce flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
           </svg>
           List & Link copied!
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-[#141414]/90 backdrop-blur-md border-b border-zinc-900 py-4 px-6 flex justify-between items-center">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={resetSearch}
        >
           <span className="text-2xl font-black text-[#E50914] tracking-tighter">FLIXPIX</span>
        </div>
        
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="group relative p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-zinc-300 group-hover:text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {history.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border border-black"></span>}
        </button>
      </nav>

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelectHistory={handleHistorySelect}
      />

      {/* --- HERO / SEARCH VIEW --- */}
      {view === 'home' && (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-16">
          
          {/* Background Ambient Light */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60vw] h-[40vh] bg-red-900/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-4xl w-full text-center relative z-20 space-y-8">
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-4">
              WHAT'S THE <br/> <span className="text-[#E50914]">MOOD?</span>
            </h1>
            
            {/* Search Input Container */}
            <div className="w-full max-w-2xl mx-auto relative mt-12">
              <div className="relative border-b-2 border-zinc-700 focus-within:border-[#E50914] transition-colors duration-300 flex items-center pb-2">
                <input 
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={loadingState === LoadingState.LOADING}
                  placeholder="Type how you feel..."
                  className="flex-1 bg-transparent border-none outline-none text-white px-2 text-2xl md:text-3xl placeholder-zinc-700 font-bold disabled:opacity-50 text-center md:text-left"
                  autoFocus
                />
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleVoiceInput}
                    className={`transition-all duration-200 ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-500 hover:text-white'}`}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 00-3 3v1.5a3 3 0 006 0v-1.5a3 3 0 00-3-3z" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => handleSearch()}
                    disabled={loadingState === LoadingState.LOADING || !mood}
                    className="text-white hover:text-[#E50914] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Percentage Loader */}
            <div className="h-16 flex items-center justify-center mt-6">
              {loadingState === LoadingState.LOADING ? (
                <div className="text-center">
                  <span className="text-6xl font-black text-zinc-800 tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm">
                   <button onClick={handleSurpriseMe} className="text-zinc-500 hover:text-white transition-colors">
                     Randomize
                   </button>
                   <span className="text-zinc-800 hidden md:inline">|</span>
                   <div className="flex gap-2">
                      {filters.map(f => (
                        <button 
                          key={f}
                          onClick={() => setActiveFilter(f)}
                          className={`px-3 py-1 rounded-full border ${activeFilter === f ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {loadingState === LoadingState.ERROR && (
               <p className="text-red-500 font-bold mt-4">{errorMessage}</p>
            )}

          </div>
        </div>
      )}

      {/* --- RESULTS VIEW --- */}
      {view === 'results' && (
        <div className="min-h-screen pt-24 px-6 md:px-12 animate-in fade-in slide-in-from-bottom-10 duration-500">
          
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-zinc-800 pb-8">
               <div className="w-full md:w-auto">
                  <button 
                    onClick={resetSearch}
                    className="flex items-center text-zinc-500 hover:text-white mb-4 transition-colors text-sm uppercase tracking-widest font-bold"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    New Search
                  </button>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-none">
                    RESULTS
                  </h2>
               </div>
               
               <button 
                 onClick={handleShare}
                 className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-transform active:scale-95 shadow-lg w-full md:w-auto"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                 </svg>
                 SHARE LIST
               </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 pb-20">
              {movies.map((movie, index) => (
                <MovieCard key={index} movie={movie} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;