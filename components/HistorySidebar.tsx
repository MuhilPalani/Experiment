import React from 'react';
import { SearchHistoryItem } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectHistory: (item: SearchHistoryItem) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose, history, onSelectHistory }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-80 bg-zinc-900 border-l border-zinc-800 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Your Vibes</h2>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-64px)] p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-zinc-500 mt-10">
              <p>No history yet.</p>
              <p className="text-sm">Start searching for a vibe!</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  onSelectHistory(item);
                  onClose();
                }}
                className="group cursor-pointer p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-white truncate w-2/3">"{item.mood}"</span>
                  <span className="text-xs text-zinc-500">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                  {item.results.slice(0, 3).map((movie, idx) => (
                    <div key={idx} className="w-6 h-6 rounded-full border border-zinc-900 bg-zinc-700 overflow-hidden">
                       <img 
                        src={`https://picsum.photos/seed/${movie.title.replace(/\s+/g, '') + movie.year}/20/30`} 
                        alt="mini poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {item.results.length > 3 && (
                     <div className="w-6 h-6 rounded-full border border-zinc-900 bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-400">
                       +{item.results.length - 3}
                     </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;
