export interface Movie {
  title: string;
  year: number;
  genre: string[];
  reasoning: string;
  matchScore: number;
  director: string;
  duration: string; // e.g. "1h 45m"
  tags: string[];
  imdbScore: string;
  rottenTomatoesScore: string;
}

export interface RecommendationResponse {
  movies: Movie[];
  summary: string;
}

export interface SearchHistoryItem {
  id: string;
  mood: string;
  timestamp: number;
  results: Movie[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}