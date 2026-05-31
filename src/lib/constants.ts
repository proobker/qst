export const DEFAULT_HOBBIES = [
  "Programming",
  "Photography",
  "Hiking",
  "Fitness",
  "Reading",
  "Food",
  "Art",
  "Music",
  "Volunteering",
  "Entrepreneurship",
];

export const DEFAULT_BADGES = [
  "Food Explorer",
  "Tech Explorer",
  "Photographer",
  "Nature Hunter",
  "Fitness Warrior",
];

export const LEVEL_THRESHOLDS = [
  { level: 1, title: "Beginner", xp: 0 },
  { level: 2, title: "Explorer", xp: 100 },
  { level: 3, title: "Adventurer", xp: 300 },
  { level: 4, title: "Hero", xp: 700 },
  { level: 5, title: "Legend", xp: 1500 },
];

export const QUEST_STATUSES = [
  "generated",
  "accepted",
  "rejected",
  "pending_approval",
  "completed",
  "abandoned",
] as const;
