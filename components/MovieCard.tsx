import React from 'react';
import { Movie } from '../types';

interface MovieCardProps {
  movie: Movie;
  index: number;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, index }) => {
  const searchUrl = `https://www.netflix.com/search?q=${encodeURIComponent(movie.title)}`;

  return (
    <div 
      className="flex flex-col w-full group perspective-1000"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Black Banner Container */}
      <a 
        href={searchUrl}
        target="_blank" 
        rel="noopener noreferrer"
        className="relative w-full aspect-[4/5] bg-black border border-zinc-800 hover:border-red-600 transition-all duration-300 flex flex-col justify-between items-center p-6 cursor-pointer shadow-lg hover:shadow-red-900/20 group-hover:-translate-y-1"
      >
        {/* Top: IMDb Score */}
        <div className="flex flex-col items-center">
          <span className="text-[#F5C518] font-black text-xl tracking-widest">IMDb</span>
          <span className="text-white text-lg font-bold">{movie.imdbScore}</span>
        </div>

        {/* Middle: Title */}
        <div className="text-center w-full">
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase leading-none tracking-tighter drop-shadow-md group-hover:text-red-500 transition-colors">
            {movie.title}
          </h3>
          {/* Subtle Director Name */}
          <p className="text-zinc-600 text-xs mt-2 uppercase tracking-widest">{movie.director}</p>
        </div>

        {/* Bottom: Year */}
        <div className="border-t border-zinc-800 w-12 pt-2 flex justify-center">
          <span className="text-zinc-400 font-mono text-sm">{movie.year}</span>
        </div>

        {/* Hover Action Overlay (Subtle) */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </a>

      {/* Description Below Banner */}
      <div className="mt-4 px-1">
        <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-zinc-700 pl-3 group-hover:border-red-600 transition-colors">
          {movie.reasoning}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-3">
            {movie.genre.slice(0, 2).map(g => (
                <span key={g} className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-800 px-2 py-1">
                    {g}
                </span>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;