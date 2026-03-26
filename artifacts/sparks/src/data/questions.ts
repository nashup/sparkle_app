export type GameType = "know-me-better" | "pick-one" | "dare-reveal";

export interface Question {
  id: string;
  text: string;
  type: GameType;
  level: number; // 1-4
  options?: string[]; // for pick-one or multiple choice
}

export const QUESTIONS: Question[] = [
  // LEVEL 1 - Casual
  { id: "q1_1", text: "What's your ultimate comfort food?", type: "know-me-better", level: 1 },
  { id: "q1_2", text: "What's a weird habit you have?", type: "know-me-better", level: 1 },
  { id: "q1_3", text: "Early bird or night owl?", type: "pick-one", level: 1, options: ["Early Bird", "Night Owl"] },
  { id: "q1_4", text: "Sweet or savory snacks?", type: "pick-one", level: 1, options: ["Sweet", "Savory"] },
  { id: "q1_5", text: "Reveal your most recently used emoji.", type: "dare-reveal", level: 1 },
  
  // LEVEL 2 - Flirty
  { id: "q2_1", text: "What's the first thing you noticed about me?", type: "know-me-better", level: 2 },
  { id: "q2_2", text: "What is your idea of a perfect date?", type: "know-me-better", level: 2 },
  { id: "q2_3", text: "Good morning texts or goodnight calls?", type: "pick-one", level: 2, options: ["Morning Texts", "Night Calls"] },
  { id: "q2_4", text: "Cuddling or holding hands?", type: "pick-one", level: 2, options: ["Cuddling", "Holding Hands"] },
  { id: "q2_5", text: "Dare: Give the other person a compliment they haven't heard before.", type: "dare-reveal", level: 2 },
  
  // LEVEL 3 - Intimate (18+)
  { id: "q3_1", text: "What's a romantic fantasy you've never told anyone?", type: "know-me-better", level: 3 },
  { id: "q3_2", text: "Where is the most adventurous place you'd want to travel together?", type: "know-me-better", level: 3 },
  { id: "q3_3", text: "Passionate kisses or soft gentle ones?", type: "pick-one", level: 3, options: ["Passionate", "Soft"] },
  { id: "q3_4", text: "A weekend in bed or a weekend exploring a new city?", type: "pick-one", level: 3, options: ["In Bed", "Exploring"] },
  { id: "q3_5", text: "Reveal: What outfit of mine is your favorite?", type: "dare-reveal", level: 3 },
  
  // LEVEL 4 - Bold (18+)
  { id: "q4_1", text: "What is something you've always wanted to try but haven't yet?", type: "know-me-better", level: 4 },
  { id: "q4_2", text: "What's your biggest turn-on?", type: "know-me-better", level: 4 },
  { id: "q4_3", text: "Lights on or lights off?", type: "pick-one", level: 4, options: ["Lights On", "Lights Off"] },
  { id: "q4_4", text: "Morning or late night?", type: "pick-one", level: 4, options: ["Morning", "Late Night"] },
  { id: "q4_5", text: "Dare: Send a risky text right now.", type: "dare-reveal", level: 4 },
];

export const AVATARS = [
  "🐱", "🦊", "🐼", "🦋", "🌸", "🍓", "🌙", "⭐", "🔥", "💎", "🎭", "🦄"
];

export function getRandomQuestions(type: GameType, level: number, count: number = 5): Question[] {
  const filtered = QUESTIONS.filter(q => q.type === type && q.level === level);
  // Shuffle array
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
