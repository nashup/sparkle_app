export type GameType = "know-me-better" | "pick-one" | "dare-reveal";

export interface Question {
  id: string;
  text: string;
  type: GameType;
  level: number;
  options?: string[];
}

export const QUESTIONS: Question[] = [
  // ── KNOW ME BETTER ──────────────────────────────────────────────────────────
  // Level 1 – Casual
  { id: "kmb1_1", text: "What's your ultimate comfort food?", type: "know-me-better", level: 1 },
  { id: "kmb1_2", text: "What weird habit do you have that most people don't know about?", type: "know-me-better", level: 1 },
  { id: "kmb1_3", text: "What's the funniest thing that's happened to you this week?", type: "know-me-better", level: 1 },
  { id: "kmb1_4", text: "What TV show could you re-watch forever?", type: "know-me-better", level: 1 },
  { id: "kmb1_5", text: "What's a skill you're secretly proud of?", type: "know-me-better", level: 1 },
  { id: "kmb1_6", text: "What's the most spontaneous thing you've ever done?", type: "know-me-better", level: 1 },
  { id: "kmb1_7", text: "What's something on your bucket list that surprises people?", type: "know-me-better", level: 1 },
  { id: "kmb1_8", text: "What does your ideal lazy Sunday look like?", type: "know-me-better", level: 1 },
  { id: "kmb1_9", text: "What song always puts you in a good mood?", type: "know-me-better", level: 1 },
  { id: "kmb1_10", text: "What's the most random fact you know by heart?", type: "know-me-better", level: 1 },

  // Level 2 – Flirty
  { id: "kmb2_1", text: "What's the first thing you noticed about me?", type: "know-me-better", level: 2 },
  { id: "kmb2_2", text: "What's your idea of a perfect date?", type: "know-me-better", level: 2 },
  { id: "kmb2_3", text: "What little thing does someone do that instantly makes you like them more?", type: "know-me-better", level: 2 },
  { id: "kmb2_4", text: "Have you ever had a crush on someone for a silly reason?", type: "know-me-better", level: 2 },
  { id: "kmb2_5", text: "What's the most romantic thing you've ever done for someone?", type: "know-me-better", level: 2 },
  { id: "kmb2_6", text: "What's something small I do that you find really attractive?", type: "know-me-better", level: 2 },
  { id: "kmb2_7", text: "Describe your ideal partner in 3 words.", type: "know-me-better", level: 2 },
  { id: "kmb2_8", text: "What's something you've never told anyone about your love life?", type: "know-me-better", level: 2 },
  { id: "kmb2_9", text: "What's a small gesture that means a lot to you in a relationship?", type: "know-me-better", level: 2 },
  { id: "kmb2_10", text: "What's the cheesiest pickup line you actually found funny?", type: "know-me-better", level: 2 },

  // Level 3 – Romantic / Intimate (18+)
  { id: "kmb3_1", text: "What's a romantic fantasy you've never told anyone?", type: "know-me-better", level: 3 },
  { id: "kmb3_2", text: "What part of your body do you feel most confident about?", type: "know-me-better", level: 3 },
  { id: "kmb3_3", text: "What's the most intimate moment you've had with someone without it being physical?", type: "know-me-better", level: 3 },
  { id: "kmb3_4", text: "What's a secret desire you've been too shy to voice?", type: "know-me-better", level: 3 },
  { id: "kmb3_5", text: "What does intimacy mean to you beyond the physical?", type: "know-me-better", level: 3 },
  { id: "kmb3_6", text: "What's the most attractive thing someone can do with their voice?", type: "know-me-better", level: 3 },
  { id: "kmb3_7", text: "What's something you wish people would just ask you about directly?", type: "know-me-better", level: 3 },
  { id: "kmb3_8", text: "What's your love language and how do you want it shown to you?", type: "know-me-better", level: 3 },
  { id: "kmb3_9", text: "What's the most daring thing you've ever worn or done to feel attractive?", type: "know-me-better", level: 3 },
  { id: "kmb3_10", text: "How do you like to be touched when you want to feel comforted vs desired?", type: "know-me-better", level: 3 },

  // Level 4 – Bold / Explicit (18+)
  { id: "kmb4_1", text: "What is something you've always wanted to try in bed but haven't yet?", type: "know-me-better", level: 4 },
  { id: "kmb4_2", text: "What's your biggest turn-on that most people wouldn't expect?", type: "know-me-better", level: 4 },
  { id: "kmb4_3", text: "Describe the hottest dream you've ever had.", type: "know-me-better", level: 4 },
  { id: "kmb4_4", text: "What's the wildest place you've ever hooked up or want to?", type: "know-me-better", level: 4 },
  { id: "kmb4_5", text: "What's a position or scenario you think about often?", type: "know-me-better", level: 4 },
  { id: "kmb4_6", text: "What's the dirtiest thought you've had today?", type: "know-me-better", level: 4 },
  { id: "kmb4_7", text: "What's one thing that would immediately make you lose attraction for someone?", type: "know-me-better", level: 4 },
  { id: "kmb4_8", text: "What part of the other person's body are you most attracted to and why?", type: "know-me-better", level: 4 },
  { id: "kmb4_9", text: "How do you feel about role play — what scenario would you want to try?", type: "know-me-better", level: 4 },
  { id: "kmb4_10", text: "What does the perfect night of passion look like from start to finish?", type: "know-me-better", level: 4 },

  // ── PICK ONE ────────────────────────────────────────────────────────────────
  // Level 1 – Casual
  { id: "po1_1", text: "Early bird or night owl?", type: "pick-one", level: 1, options: ["Early Bird 🐦", "Night Owl 🦉"] },
  { id: "po1_2", text: "Sweet or savory?", type: "pick-one", level: 1, options: ["Sweet 🍫", "Savory 🧀"] },
  { id: "po1_3", text: "Mountains or beach?", type: "pick-one", level: 1, options: ["Mountains 🏔️", "Beach 🏖️"] },
  { id: "po1_4", text: "Coffee or tea?", type: "pick-one", level: 1, options: ["Coffee ☕", "Tea 🍵"] },
  { id: "po1_5", text: "Movie night in or going out?", type: "pick-one", level: 1, options: ["Movie Night In 🎬", "Going Out 🎉"] },
  { id: "po1_6", text: "Text or voice call?", type: "pick-one", level: 1, options: ["Text 💬", "Voice Call 📞"] },
  { id: "po1_7", text: "Summer or winter?", type: "pick-one", level: 1, options: ["Summer ☀️", "Winter ❄️"] },
  { id: "po1_8", text: "Cooking at home or ordering in?", type: "pick-one", level: 1, options: ["Cooking At Home 🍳", "Ordering In 🛵"] },
  { id: "po1_9", text: "Dogs or cats?", type: "pick-one", level: 1, options: ["Dogs 🐶", "Cats 🐱"] },
  { id: "po1_10", text: "Adventure trip or luxury resort?", type: "pick-one", level: 1, options: ["Adventure Trip 🧗", "Luxury Resort 🏨"] },

  // Level 2 – Flirty
  { id: "po2_1", text: "Good morning texts or goodnight calls?", type: "pick-one", level: 2, options: ["Morning Texts 🌅", "Night Calls 🌙"] },
  { id: "po2_2", text: "Cuddling or holding hands?", type: "pick-one", level: 2, options: ["Cuddling 🤗", "Holding Hands 🤝"] },
  { id: "po2_3", text: "Surprise date or planned date?", type: "pick-one", level: 2, options: ["Surprise Date 🎁", "Planned Date 📅"] },
  { id: "po2_4", text: "Bold and confident or shy and mysterious?", type: "pick-one", level: 2, options: ["Bold & Confident 💪", "Shy & Mysterious 🫣"] },
  { id: "po2_5", text: "Long kiss hello or hug from behind?", type: "pick-one", level: 2, options: ["Long Kiss 💋", "Hug From Behind 🫂"] },
  { id: "po2_6", text: "Love letters or love songs?", type: "pick-one", level: 2, options: ["Love Letters 💌", "Love Songs 🎵"] },
  { id: "po2_7", text: "Flirty banter or deep conversation?", type: "pick-one", level: 2, options: ["Flirty Banter 😏", "Deep Conversation 🌊"] },
  { id: "po2_8", text: "First to say I love you or wait?", type: "pick-one", level: 2, options: ["Say It First ❤️", "Wait For It 🥹"] },
  { id: "po2_9", text: "Giving or receiving compliments?", type: "pick-one", level: 2, options: ["Giving 🎀", "Receiving 🫦"] },
  { id: "po2_10", text: "Romantic dinner or spontaneous picnic?", type: "pick-one", level: 2, options: ["Romantic Dinner 🕯️", "Spontaneous Picnic 🧺"] },

  // Level 3 – Intimate (18+)
  { id: "po3_1", text: "Passionate kisses or soft gentle ones?", type: "pick-one", level: 3, options: ["Passionate 🔥", "Soft & Gentle 🌸"] },
  { id: "po3_2", text: "A weekend in bed or exploring a new city?", type: "pick-one", level: 3, options: ["Weekend In Bed 🛏️", "Exploring City 🗺️"] },
  { id: "po3_3", text: "Slow burn or instant chemistry?", type: "pick-one", level: 3, options: ["Slow Burn 🕯️", "Instant Chemistry ⚡"] },
  { id: "po3_4", text: "Whisper in ear or intense eye contact?", type: "pick-one", level: 3, options: ["Whisper In Ear 🫦", "Eye Contact 👀"] },
  { id: "po3_5", text: "Candlelit room or outdoor under the stars?", type: "pick-one", level: 3, options: ["Candlelit Room 🕯️", "Under The Stars ✨"] },
  { id: "po3_6", text: "Say what you want or let them guess?", type: "pick-one", level: 3, options: ["Say It Directly 🗣️", "Let Them Guess 🤫"] },
  { id: "po3_7", text: "Confidence or vulnerability?", type: "pick-one", level: 3, options: ["Confidence 💎", "Vulnerability 💜"] },
  { id: "po3_8", text: "Shower together or candlelit bath?", type: "pick-one", level: 3, options: ["Shower Together 🚿", "Candlelit Bath 🛁"] },
  { id: "po3_9", text: "Sleep naked or comfortable sleepwear?", type: "pick-one", level: 3, options: ["Sleep Naked 😏", "Comfy Sleepwear 🩲"] },
  { id: "po3_10", text: "Dominant or submissive energy?", type: "pick-one", level: 3, options: ["Dominant 👑", "Submissive 🫀"] },

  // Level 4 – Bold / Explicit (18+)
  { id: "po4_1", text: "Lights on or lights off?", type: "pick-one", level: 4, options: ["Lights On 💡", "Lights Off 🌑"] },
  { id: "po4_2", text: "Early morning or late night?", type: "pick-one", level: 4, options: ["Early Morning 🌄", "Late Night 🌃"] },
  { id: "po4_3", text: "Slow and sensual or fast and rough?", type: "pick-one", level: 4, options: ["Slow & Sensual 🌊", "Fast & Rough 🔥"] },
  { id: "po4_4", text: "Sext or send a photo?", type: "pick-one", level: 4, options: ["Sext 💬", "Send A Photo 📸"] },
  { id: "po4_5", text: "Public adventure or private escape?", type: "pick-one", level: 4, options: ["Public Adventure 😈", "Private Escape 🔐"] },
  { id: "po4_6", text: "Role play or no strings?", type: "pick-one", level: 4, options: ["Role Play 🎭", "No Strings 🪢"] },
  { id: "po4_7", text: "Mirror in the room or blindfold?", type: "pick-one", level: 4, options: ["Mirror 🪞", "Blindfold 🖤"] },
  { id: "po4_8", text: "Talking dirty or complete silence?", type: "pick-one", level: 4, options: ["Talk Dirty 🗣️🔥", "Complete Silence 🤫"] },
  { id: "po4_9", text: "Being watched or doing the watching?", type: "pick-one", level: 4, options: ["Being Watched 👁️", "Doing The Watching 😏"] },
  { id: "po4_10", text: "Tie them up or be tied up?", type: "pick-one", level: 4, options: ["Tie Them Up 🎀", "Be Tied Up 🪢"] },

  // ── DARE / REVEAL ───────────────────────────────────────────────────────────
  // Level 1 – Casual
  { id: "dr1_1", text: "Reveal: Show the other person your most recent photo in your camera roll.", type: "dare-reveal", level: 1 },
  { id: "dr1_2", text: "Dare: Send a voice note saying something kind about the other person.", type: "dare-reveal", level: 1 },
  { id: "dr1_3", text: "Reveal: What's the last lie you told, even a tiny white lie?", type: "dare-reveal", level: 1 },
  { id: "dr1_4", text: "Dare: Do your best impression of a celebrity right now.", type: "dare-reveal", level: 1 },
  { id: "dr1_5", text: "Reveal: What's your most embarrassing childhood memory?", type: "dare-reveal", level: 1 },
  { id: "dr1_6", text: "Dare: Show your most recent emoji reaction on your phone.", type: "dare-reveal", level: 1 },
  { id: "dr1_7", text: "Reveal: What's the worst date you've ever been on?", type: "dare-reveal", level: 1 },
  { id: "dr1_8", text: "Dare: Sing the first 10 seconds of the last song stuck in your head.", type: "dare-reveal", level: 1 },
  { id: "dr1_9", text: "Reveal: What's a secret talent no one knows about?", type: "dare-reveal", level: 1 },
  { id: "dr1_10", text: "Dare: Text someone you haven't talked to in over a year right now.", type: "dare-reveal", level: 1 },

  // Level 2 – Flirty
  { id: "dr2_1", text: "Dare: Give the other person a compliment they've never heard before.", type: "dare-reveal", level: 2 },
  { id: "dr2_2", text: "Reveal: What's the most flirty thing you've ever texted someone?", type: "dare-reveal", level: 2 },
  { id: "dr2_3", text: "Dare: Write a 2-sentence love story about us right now.", type: "dare-reveal", level: 2 },
  { id: "dr2_4", text: "Reveal: Who was your first real crush and why?", type: "dare-reveal", level: 2 },
  { id: "dr2_5", text: "Dare: Send a flirty GIF or meme to the other person right now.", type: "dare-reveal", level: 2 },
  { id: "dr2_6", text: "Reveal: What's the most romantic thing you've ever done that didn't go as planned?", type: "dare-reveal", level: 2 },
  { id: "dr2_7", text: "Dare: Describe in detail what your ideal kiss with the other person would feel like.", type: "dare-reveal", level: 2 },
  { id: "dr2_8", text: "Reveal: What's a pet name you'd secretly want to be called?", type: "dare-reveal", level: 2 },
  { id: "dr2_9", text: "Dare: Rate the other person's profile picture out of 10 with reasoning.", type: "dare-reveal", level: 2 },
  { id: "dr2_10", text: "Reveal: What's the most impulsive romantic thing you've ever done?", type: "dare-reveal", level: 2 },

  // Level 3 – Intimate (18+)
  { id: "dr3_1", text: "Reveal: What outfit of mine is your favorite and why?", type: "dare-reveal", level: 3 },
  { id: "dr3_2", text: "Dare: Send the most intimate song you'd want to listen to together.", type: "dare-reveal", level: 3 },
  { id: "dr3_3", text: "Reveal: Where on your body do you love being touched the most?", type: "dare-reveal", level: 3 },
  { id: "dr3_4", text: "Dare: Describe exactly what you'd want to happen if we were alone together right now.", type: "dare-reveal", level: 3 },
  { id: "dr3_5", text: "Reveal: What's the most daring thing you've ever done to feel sexy?", type: "dare-reveal", level: 3 },
  { id: "dr3_6", text: "Dare: Send a voice note in your most seductive voice saying something sweet.", type: "dare-reveal", level: 3 },
  { id: "dr3_7", text: "Reveal: What's a fantasy you've thought about more than once?", type: "dare-reveal", level: 3 },
  { id: "dr3_8", text: "Dare: Describe your perfect intimate evening in one paragraph.", type: "dare-reveal", level: 3 },
  { id: "dr3_9", text: "Reveal: Have you ever done anything in public you probably shouldn't have?", type: "dare-reveal", level: 3 },
  { id: "dr3_10", text: "Dare: Tell the other person what you find most physically irresistible about them.", type: "dare-reveal", level: 3 },

  // Level 4 – Bold / Explicit (18+)
  { id: "dr4_1", text: "Dare: Send a risky or suggestive text right now.", type: "dare-reveal", level: 4 },
  { id: "dr4_2", text: "Reveal: Describe the hottest experience you've ever had in detail.", type: "dare-reveal", level: 4 },
  { id: "dr4_3", text: "Dare: Tell the other person exactly what you want to do to them later.", type: "dare-reveal", level: 4 },
  { id: "dr4_4", text: "Reveal: What's a sexual position you want to try but haven't yet?", type: "dare-reveal", level: 4 },
  { id: "dr4_5", text: "Dare: Start a voice note with 'The things I want to do to you...' and finish it.", type: "dare-reveal", level: 4 },
  { id: "dr4_6", text: "Reveal: What's the dirtiest thing you've ever done on a first date?", type: "dare-reveal", level: 4 },
  { id: "dr4_7", text: "Dare: Name three places on your body you want to be kissed right now.", type: "dare-reveal", level: 4 },
  { id: "dr4_8", text: "Reveal: What is your guiltiest sexual pleasure?", type: "dare-reveal", level: 4 },
  { id: "dr4_9", text: "Dare: Describe in full detail what your perfect night of passion looks like.", type: "dare-reveal", level: 4 },
  { id: "dr4_10", text: "Reveal: What's one thing you'd do with no hesitation if you knew the other person was fully on board?", type: "dare-reveal", level: 4 },
];

export const AVATARS = [
  "🐱", "🦊", "🐼", "🦋", "🌸", "🍓", "🌙", "⭐", "🔥", "💎", "🎭", "🦄"
];

// Seeded shuffle — both players get the same order for the same room + game combo
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const rng = () => {
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getQuestionsForGame(type: GameType, level: number, roomCode: string): Question[] {
  const filtered = QUESTIONS.filter(q => q.type === type && q.level === level);
  return seededShuffle(filtered, `${roomCode}-${type}-${level}`);
}
