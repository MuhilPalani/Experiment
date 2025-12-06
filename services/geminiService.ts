import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RecommendationResponse } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const movieSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The full title of the movie." },
    year: { type: Type.INTEGER, description: "The release year." },
    genre: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of primary genres."
    },
    reasoning: { type: Type.STRING, description: "A witty, personalized sentence explaining why this fits the user's mood perfectly." },
    matchScore: { type: Type.INTEGER, description: "A relevance score from 60 to 100 based on the mood." },
    director: { type: Type.STRING, description: "Name of the director." },
    duration: { type: Type.STRING, description: "Approximate runtime (e.g., '1h 54m')." },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 descriptive tags (e.g., 'Mind-bending', 'Dark', 'Slow-burn')."
    },
    imdbScore: { type: Type.STRING, description: "IMDb rating (e.g. '8.1'). Estimate if unknown." },
    rottenTomatoesScore: { type: Type.STRING, description: "Rotten Tomatoes percentage (e.g. '92%'). Estimate if unknown." }
  },
  required: ["title", "year", "genre", "reasoning", "matchScore", "director", "duration", "tags", "imdbScore", "rottenTomatoesScore"]
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    movies: {
      type: Type.ARRAY,
      items: movieSchema,
      description: "A curated list of 4-8 recommended movies."
    },
    summary: {
      type: Type.STRING,
      description: "A short, charismatic curator's comment acknowledging the vibe."
    }
  },
  required: ["movies", "summary"]
};

export const getMovieRecommendations = async (mood: string, filters?: string): Promise<RecommendationResponse> => {
  try {
    const prompt = `
      You are FlixPix, a world-class cinema curator.
      
      User Mood Context: "${mood}"
      ${filters ? `Constraints: ${filters}` : ''}

      Task:
      1. Analyze the mood.
      2. Suggest 4 to 8 movies.
      3. **RANKING LOGIC:** You MUST sort the results based on a weighted combination of **IMDb Score** (Quality) and **Recency** (New Releases). 
         - A high IMDb score is the most important factor.
         - Recent releases (last 5 years) get a slight boost.
      4. Ensure the recommendations are actually good (avoid low-rated filler).
      5. Output strictly in JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as RecommendationResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};