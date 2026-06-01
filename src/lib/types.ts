import { NOTIFICATION_TYPES, QUEST_STATUSES } from "@/lib/constants";

export type QuestStatus = (typeof QUEST_STATUSES)[number];

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  xp: number;
  location_enabled: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type QuestDefinition = {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  xp_reward: number;
  badge_reward: string | null;
  estimated_time: string;
  category: string;
};

export type FriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  senderName?: string;
  senderAvatar?: string | null;
  receiverName?: string;
  receiverAvatar?: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  entity_id: string | null;
  entity_type: string | null;
  message: string;
  read: boolean;
  created_at: string;
  actor?: { id: string; name: string; avatar: string | null } | null;
};

export type FeedPost = {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
  edited_at: string | null;
  edit_count: number;
  user_id: string;
  quest_id: string;
  users: { id: string; name: string; avatar: string | null } | null;
  quests: { id: string; title: string; difficulty: string; xp_reward: number; category: string } | null;
  approvalsCount: number;
  friendsTotal: number;
  approvalPercent: number;
  votedByUser: boolean | null;
};

export type ImageEditMetadata = {
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  filter: string;
  crop: { x: number; y: number; width: number; height: number } | null;
};

export type ProfileSummary = {
  profile: UserProfile | null;
  badges: Array<{ id: string; name: string; icon: string | null }>;
  completedQuests: Array<{ id: string; quests: Record<string, unknown> | null }>;
  posts: Array<Record<string, unknown>>;
  friendsCount: number;
};
