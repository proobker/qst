import type { User } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
import {
  DEFAULT_HOBBIES,
  MIN_FRIENDS_REQUIRED,
  QUEST_ACCEPT_DEADLINE_HOURS,
} from "@/lib/constants";
import { levelFromXp, titleForLevel, getLevelDefinition } from "@/lib/leveling";
import { type LevelUpCelebration, parseLevelFromNotificationMessage } from "@/lib/level-up";
import { generateQuest, recommendBadges, type GenerateQuestErrorReason } from "@/lib/ai";
import {
  FeedPost,
  FriendRequest,
  FriendStatus,
  Notification,
  ProfileSummary,
  QuestDefinition,
  UserProfile,
} from "@/lib/types";
import { validateCustomHobbyName } from "@/lib/hobby-validation";
import {
  isFullEmailAddress,
  meetsApprovalThreshold,
  percentFromVotes,
  tallyFriendVotes,
} from "@/lib/utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function fallbackDisplayName(user: User) {
  return (user.user_metadata?.full_name as string | undefined) || user.email?.split("@")[0] || "Adventurer";
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();

  if (existing) {
    return existing as UserProfile;
  }

  const payload = {
    id: user.id,
    email: user.email ?? "",
    name: fallbackDisplayName(user),
    avatar: (user.user_metadata?.avatar_url as string | undefined) ?? null,
    level: 1,
    xp: 0,
  };

  const { data } = await supabase.from("users").insert(payload).select("*").single();
  return data as UserProfile;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return (data as UserProfile | null) ?? null;
}

export async function updateProfileBio(userId: string, bio: string) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("users").update({ bio: bio.trim() || null, updated_at: new Date().toISOString() }).eq("id", userId);
}

export async function listHobbies(): Promise<Array<{ id: number; name: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("hobbies").select("id,name").order("name", { ascending: true });
  const hobbies = (data as Array<{ id: number; name: string }> | null) ?? [];

  if (hobbies.length > 0) {
    return hobbies;
  }

  const seedPayload = DEFAULT_HOBBIES.map((name) => ({ name }));
  await supabase.from("hobbies").upsert(seedPayload, { onConflict: "name", ignoreDuplicates: true });
  const { data: seeded } = await supabase.from("hobbies").select("id,name").order("name", { ascending: true });
  return (seeded as Array<{ id: number; name: string }> | null) ?? [];
}

export async function getOnboardingState(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [profileResult, hobbiesResult] = await Promise.all([
    supabase
      .from("users")
      .select("location_enabled,latitude,longitude")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_hobbies")
      .select("hobby_id, hobbies(name)")
      .eq("user_id", userId),
  ]);

  const profile = profileResult.data as { location_enabled: boolean; latitude: number | null; longitude: number | null } | null;
  const selected = (hobbiesResult.data as Array<{ hobby_id: number; hobbies: { name: string } | null }> | null) ?? [];

  const selectedHobbyIds = selected.map((row) => row.hobby_id);
  const selectedHobbies = selected
    .map((row) => row.hobbies?.name)
    .filter((name): name is string => Boolean(name));

  return {
    selectedHobbyIds,
    selectedHobbies,
    locationEnabled: profile?.location_enabled ?? false,
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    complete: selectedHobbies.length > 0 && (profile?.location_enabled ?? false),
  };
}

export async function createHobby(name: string): Promise<{ id: number; name: string } | null> {
  const validation = validateCustomHobbyName(name);
  if (!validation.ok) {
    return null;
  }

  const trimmed = validation.name;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("hobbies").insert({ name: trimmed }).select("id,name").maybeSingle();

  if (!error && data) {
    return data as { id: number; name: string };
  }

  const { data: existing } = await supabase.from("hobbies").select("id,name").eq("name", trimmed).maybeSingle();
  return (existing as { id: number; name: string } | null) ?? null;
}

export async function saveOnboarding(
  userId: string,
  options: { hobbyIds: number[]; latitude: number | null; longitude: number | null },
) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("user_hobbies").delete().eq("user_id", userId);
  if (options.hobbyIds.length > 0) {
    await supabase.from("user_hobbies").insert(options.hobbyIds.map((hobbyId) => ({ user_id: userId, hobby_id: hobbyId })));
  }

  await supabase
    .from("users")
    .update({
      location_enabled: options.latitude !== null && options.longitude !== null,
      latitude: options.latitude,
      longitude: options.longitude,
    })
    .eq("id", userId);

  await supabase.from("user_quests").delete().eq("user_id", userId).eq("status", "generated");
}

async function getUserQuestHistory(userId: string): Promise<{
  previousQuestTitles: string[];
  completedQuests: string[];
  rejectedQuests: string[];
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_quests")
    .select("quests(title), status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const quests = (data as unknown as Array<{ quests: { title: string } | null; status: string } | null> ?? [])
    .filter((row): row is { quests: { title: string }; status: string } => row !== null && row.quests !== null);

  const previousQuestTitles = quests.map((row) => row.quests.title);
  const completedQuests = quests.filter((row) => row.status === "completed").map((row) => row.quests.title);
  const rejectedQuests = quests.filter((row) => row.status === "rejected").map((row) => row.quests.title);

  return {
    previousQuestTitles,
    completedQuests,
    rejectedQuests,
  };
}

type DiscoveryAssignment = {
  id: string;
  quest_id: string;
  status: string;
  quests: QuestDefinition & { id: string };
};

function normalizeEmbeddedQuest(quests: unknown): (QuestDefinition & { id: string }) | null {
  if (!quests) {
    return null;
  }
  if (Array.isArray(quests)) {
    const first = quests[0];
    if (!first || typeof first !== "object") {
      return null;
    }
    return first as QuestDefinition & { id: string };
  }
  if (typeof quests === "object") {
    return quests as QuestDefinition & { id: string };
  }
  return null;
}

export type DiscoveryQuestResult = {
  assignments: DiscoveryAssignment[];
  error?: GenerateQuestErrorReason;
};

const discoveryInflight = new Map<string, Promise<DiscoveryQuestResult>>();

async function getDiscoveryQuestInternal(userId: string): Promise<DiscoveryQuestResult> {
  noStore();
  const supabase = await createSupabaseServerClient();

  await expireStaleAcceptedQuests(userId);

  const { data: generatedRows, error: fetchError } = await supabase
    .from("user_quests")
    .select("id, quest_id, status, created_at, quests(*)")
    .eq("user_id", userId)
    .eq("status", "generated")
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("[QuestSwipe] Failed to fetch generated assignments:", fetchError);
  }

  const existingAssignments = (generatedRows ?? [])
    .map((row) => {
      const existingQuest = normalizeEmbeddedQuest(row.quests);
      if (!existingQuest) {
        return null;
      }
      return {
        id: row.id,
        quest_id: row.quest_id,
        status: row.status,
        quests: existingQuest,
      } satisfies DiscoveryAssignment;
    })
    .filter((value): value is DiscoveryAssignment => Boolean(value));

  if (existingAssignments.length > 0) {
    console.log("[QuestSwipe] Serving existing generated quest stack:", existingAssignments.length);
    return { assignments: existingAssignments };
  }

  console.log("[QuestSwipe] No generated quest stack — calling Gemini for user:", userId);

  const [profile, onboarding, history] = await Promise.all([
    getProfile(userId),
    getOnboardingState(userId),
    getUserQuestHistory(userId),
  ]);

  if (!profile) {
    console.error("[QuestSwipe] User profile not found");
    return { assignments: [], error: "api_error" };
  }

  console.log("[QuestSwipe] Generating quest with context:", {
    hobbyCount: onboarding.selectedHobbies.length,
    level: profile.level,
    historyCount: history.previousQuestTitles.length,
    rejectedCount: history.rejectedQuests.length,
  });

  const generation = await generateQuest({
    hobbies: onboarding.selectedHobbies,
    location: { latitude: onboarding.latitude, longitude: onboarding.longitude },
    level: profile.level,
    previousQuestTitles: history.previousQuestTitles,
    completedQuests: history.completedQuests,
    rejectedQuests: history.rejectedQuests,
  });

  if (!generation.ok) {
    console.error("[QuestSwipe] Gemini failed:", generation.reason, generation.message ?? "");
    return { assignments: [], error: generation.reason };
  }

  const generatedQuests = generation.quests;

  if (!generatedQuests || generatedQuests.length === 0) {
    console.error("[QuestSwipe] Gemini returned empty quest batch");
    return { assignments: [], error: "invalid_response" };
  }

  if (generation.offline) {
    console.warn("[QuestSwipe] Persisting offline quest batch (Gemini quota/cooldown):", generatedQuests[0].title);
  } else {
    console.log("[QuestSwipe] Persisting Gemini quest batch:", generatedQuests[0].title, `(${generation.model})`);
  }

  const createdAssignments: DiscoveryAssignment[] = [];

  for (const generatedQuest of generatedQuests) {
    const { data: insertedQuest, error: insertQuestError } = await supabase
      .from("quests")
      .insert({
        creator_ai: true,
        title: generatedQuest.title,
        description: generatedQuest.description,
        difficulty: generatedQuest.difficulty,
        xp_reward: generatedQuest.xp_reward,
        badge_reward: generatedQuest.badge_reward,
        estimated_time: generatedQuest.estimated_time,
        category: generatedQuest.category,
      })
      .select("*")
      .single();

    if (insertQuestError || !insertedQuest) {
      console.error("[QuestSwipe] Failed to insert quest into database:", insertQuestError);
      return { assignments: [], error: "api_error" };
    }

    const insertedQuestId = (insertedQuest as { id: string }).id;

    const { data: assignment, error: assignmentError } = await supabase
      .from("user_quests")
      .insert({
        user_id: userId,
        quest_id: insertedQuestId,
        status: "generated",
      })
      .select("id, quest_id, status, quests(*)")
      .maybeSingle();

    if (assignmentError) {
      console.error("[QuestSwipe] Failed to create user quest assignment:", assignmentError);
      if (assignmentError.code === "23505") {
        // Another concurrent request likely created a full stack; serve the canonical one.
        await supabase.from("quests").delete().eq("id", insertedQuestId);
        const { data: parallelRows } = await supabase
          .from("user_quests")
          .select("id, quest_id, status, quests(*)")
          .eq("user_id", userId)
          .eq("status", "generated")
          .order("created_at", { ascending: true });

        const parallelAssignments = (parallelRows ?? [])
          .map((row) => {
            const existingQuest = normalizeEmbeddedQuest(row.quests);
            if (!existingQuest) {
              return null;
            }
            return {
              id: row.id,
              quest_id: row.quest_id,
              status: row.status,
              quests: existingQuest,
            } satisfies DiscoveryAssignment;
          })
          .filter((value): value is DiscoveryAssignment => Boolean(value));

        return { assignments: parallelAssignments };
      }

      // Best-effort cleanup of an orphaned quest record.
      await supabase.from("quests").delete().eq("id", insertedQuestId);
      return { assignments: [], error: "api_error" };
    }

    if (!assignment) {
      console.error("[QuestSwipe] Failed to create user quest assignment");
      await supabase.from("quests").delete().eq("id", insertedQuestId);
      return { assignments: [], error: "api_error" };
    }

    const assignmentQuest =
      normalizeEmbeddedQuest(assignment.quests) ??
      (insertedQuest as unknown as QuestDefinition & { id: string });

    if (!assignmentQuest) {
      console.error("[QuestSwipe] Assignment created but quest data missing");
      return { assignments: [], error: "api_error" };
    }

    createdAssignments.push({
      id: assignment.id,
      quest_id: assignment.quest_id,
      status: assignment.status,
      quests: assignmentQuest,
    });
  }

  return { assignments: createdAssignments };
}

/** Deduplicates concurrent discovery requests (prevents double Gemini calls on swipe + refresh). */
export async function getDiscoveryQuest(userId: string): Promise<DiscoveryQuestResult> {
  const inflight = discoveryInflight.get(userId);
  if (inflight) {
    console.log("[QuestSwipe] Joining in-flight discovery request for user:", userId);
    return inflight;
  }

  const promise = getDiscoveryQuestInternal(userId).finally(() => {
    discoveryInflight.delete(userId);
  });
  discoveryInflight.set(userId, promise);
  return promise;
}

export async function swipeQuest(userId: string, userQuestId: string, direction: "left" | "right") {
  noStore();
  const supabase = await createSupabaseServerClient();
  const status = direction === "right" ? "accepted" : "rejected";

  console.log("[QuestSwipe] swipeQuest", { userQuestId, direction, userId });

  const payload =
    direction === "right"
      ? { status, swiped_at: new Date().toISOString(), started_at: new Date().toISOString() }
      : { status, swiped_at: new Date().toISOString(), rejected_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("user_quests")
    .update(payload)
    .eq("id", userQuestId)
    .eq("user_id", userId)
    .eq("status", "generated")
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("[QuestSwipe] swipeQuest update error:", error);
    throw new Error(`Failed to ${direction === "right" ? "accept" : "reject"} quest: ${error.message}`);
  }

  if (!data) {
    console.error("[QuestSwipe] swipeQuest updated 0 rows for:", userQuestId);
    throw new Error("Quest was already swiped or not found.");
  }

  console.log("[QuestSwipe] swipeQuest OK:", data.id, "->", data.status);
}

export async function listUserQuests(userId: string) {
  await expireStaleAcceptedQuests(userId);
  await syncPendingQuestRewards(userId);
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_quests")
    .select("id,status,created_at,pending_approval_at,completed_at,quests(*)")
    .eq("user_id", userId)
    .neq("status", "rejected")
    .order("created_at", { ascending: false });

  return (data as Array<Record<string, unknown>> | null) ?? [];
}

export async function abandonQuest(userId: string, userQuestId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("user_quests")
    .update({ status: "abandoned", abandoned_at: new Date().toISOString() })
    .eq("id", userQuestId)
    .eq("user_id", userId);
}

export async function submitQuestCompletion(
  userId: string,
  userQuestId: string,
  caption: string,
  file: File | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data: assignment } = await supabase
    .from("user_quests")
    .select("id,quest_id,status")
    .eq("id", userQuestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!assignment || assignment.status !== "accepted") {
    throw new Error("Quest is not active.");
  }

  if (!(await hasMinimumFriends(userId))) {
    throw new Error(`Add at least ${MIN_FRIENDS_REQUIRED} friend before submitting quest proof.`);
  }

  let imageUrl = "https://placehold.co/1200x800/png?text=Quest+Completion";

  if (file && file.size > 0) {
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${assignment.quest_id}/${Date.now()}.${extension}`;
    const upload = await supabase.storage.from("quest-completions").upload(path, file, { upsert: false });
    if (!upload.error) {
      const { data: publicData } = supabase.storage.from("quest-completions").getPublicUrl(path);
      imageUrl = publicData.publicUrl;
    }
  }

  await supabase.from("posts").insert({
    user_id: userId,
    quest_id: assignment.quest_id,
    image_url: imageUrl,
    caption,
  });

  await supabase
    .from("user_quests")
    .update({ status: "pending_approval", pending_approval_at: new Date().toISOString() })
    .eq("id", userQuestId)
    .eq("user_id", userId);
}

async function getFriendIds(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("friendships")
    .select("user_1,user_2")
    .or(`user_1.eq.${userId},user_2.eq.${userId}`);

  return ((data as Array<{ user_1: string; user_2: string }> | null) ?? []).map((row) =>
    row.user_1 === userId ? row.user_2 : row.user_1,
  );
}

async function countFriendsForUser(
  userId: string,
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<number> {
  const { count } = await client
    .from("friendships")
    .select("*", { count: "exact", head: true })
    .or(`user_1.eq.${userId},user_2.eq.${userId}`);

  return count ?? 0;
}

export async function getFriendCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  return countFriendsForUser(userId, supabase);
}

async function getFriendCountsForUsers(
  userIds: string[],
  client: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<Map<string, number>> {
  const counts = new Map(userIds.map((id) => [id, 0]));
  if (userIds.length === 0) {
    return counts;
  }

  const { data } = await client
    .from("friendships")
    .select("user_1,user_2")
    .or(`user_1.in.(${userIds.join(",")}),user_2.in.(${userIds.join(",")})`);

  for (const row of (data as Array<{ user_1: string; user_2: string }> | null) ?? []) {
    if (counts.has(row.user_1)) {
      counts.set(row.user_1, (counts.get(row.user_1) ?? 0) + 1);
    }
    if (counts.has(row.user_2)) {
      counts.set(row.user_2, (counts.get(row.user_2) ?? 0) + 1);
    }
  }

  return counts;
}

export async function hasMinimumFriends(userId: string): Promise<boolean> {
  return (await getFriendCount(userId)) >= MIN_FRIENDS_REQUIRED;
}

async function expireStaleAcceptedQuests(userId: string) {
  const supabase = await createSupabaseServerClient();
  const cutoff = new Date(Date.now() - QUEST_ACCEPT_DEADLINE_HOURS * 60 * 60 * 1000).toISOString();

  await supabase
    .from("user_quests")
    .update({ status: "incomplete", abandoned_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "accepted")
    .not("started_at", "is", null)
    .lt("started_at", cutoff);
}

export async function getFeed(userId: string): Promise<FeedPost[]> {
  await syncPendingQuestRewards(userId);
  const supabase = await createSupabaseServerClient();
  const friendIds = await getFriendIds(userId);
  const visibleUserIds = [userId, ...friendIds];

  const { data } = await supabase
    .from("posts")
    .select(
      "id,caption,image_url,created_at,edited_at,edit_count,user_id,quest_id,users(id,name,avatar),quests(id,title,difficulty,xp_reward,category),approvals(id,user_id,vote)",
    )
    .in("user_id", visibleUserIds)
    .order("created_at", { ascending: false });

  const posts = (data as Array<Record<string, unknown>> | null) ?? [];
  const ownerIds = [...new Set(posts.map((post) => post.user_id as string))];
  const friendCounts = await getFriendCountsForUsers(ownerIds, supabase);

  return posts.map((post) => {
    const postOwnerId = post.user_id as string;
    const approvals = (post.approvals as Array<{ user_id: string; vote: boolean }> | undefined) ?? [];
    const { approved } = tallyFriendVotes(approvals, postOwnerId);
    const friendsTotal = friendCounts.get(postOwnerId) ?? 0;
    const friendVotes = approvals.filter((vote) => vote.user_id !== postOwnerId);
    const votedByUser = friendVotes.find((vote) => vote.user_id === userId) ?? null;

    return {
      ...post,
      edited_at: (post.edited_at as string | null) ?? null,
      edit_count: Number(post.edit_count ?? 0),
      approvalsCount: approved,
      friendsTotal,
      approvalPercent: percentFromVotes(approved, friendsTotal),
      votedByUser: votedByUser?.vote ?? null,
    } as FeedPost;
  });
}

async function createNotification(payload: {
  userId: string;
  type: Notification["type"];
  actorId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  message: string;
}) {
  if (payload.actorId && payload.actorId === payload.userId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    actor_id: payload.actorId ?? null,
    entity_id: payload.entityId ?? null,
    entity_type: payload.entityType ?? null,
    message: payload.message,
  });
}

/** Re-award quests stuck in pending_approval when votes already meet the threshold. */
async function syncPendingQuestRewards(userId: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: pending } = await admin
      .from("user_quests")
      .select("quest_id")
      .eq("user_id", userId)
      .eq("status", "pending_approval");

    for (const row of pending ?? []) {
      const { data: post } = await admin
        .from("posts")
        .select("id")
        .eq("user_id", userId)
        .eq("quest_id", row.quest_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (post?.id) {
        await checkAndAwardQuestApproval(post.id, admin);
      }
    }
  } catch (error) {
    console.error("[QuestRewards] syncPendingQuestRewards skipped:", error);
  }
}

async function checkAndAwardQuestApproval(
  postId: string,
  admin = createSupabaseAdminClient(),
): Promise<boolean> {
  const { data: post } = await admin.from("posts").select("user_id").eq("id", postId).maybeSingle();
  if (!post?.user_id) {
    return false;
  }

  const { data: votes } = await admin.from("approvals").select("vote,user_id").eq("post_id", postId);
  const { approved } = tallyFriendVotes(votes ?? [], post.user_id);
  const friendCount = await countFriendsForUser(post.user_id, admin);

  if (!meetsApprovalThreshold(approved, friendCount)) {
    return false;
  }

  await awardQuestRewards(postId, admin);
  return true;
}

async function awardQuestRewards(postId: string, admin = createSupabaseAdminClient()) {
  const { data: post } = await admin
    .from("posts")
    .select("id,user_id,quest_id,quests(xp_reward,badge_reward,category)")
    .eq("id", postId)
    .maybeSingle();

  if (!post || !post.quests) {
    return;
  }

  const { data: assignment } = await admin
    .from("user_quests")
    .select("id,status")
    .eq("user_id", post.user_id)
    .eq("quest_id", post.quest_id)
    .maybeSingle();

  if (!assignment || assignment.status === "completed") {
    return;
  }

  const { error: questUpdateError } = await admin
    .from("user_quests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", assignment.id);

  if (questUpdateError) {
    console.error("[QuestRewards] Failed to mark quest completed:", questUpdateError);
    return;
  }

  const { data: profile } = await admin.from("users").select("xp,level").eq("id", post.user_id).maybeSingle();
  const questData = post.quests as unknown as { xp_reward: number; badge_reward: string | null; category: string };
  const currentXp = Number(profile?.xp ?? 0);
  const oldLevel = Number(profile?.level ?? 1);
  const rewardXp = Number(questData.xp_reward ?? 0);
  const updatedXp = currentXp + rewardXp;
  const newLevel = levelFromXp(updatedXp);

  const { error: profileUpdateError } = await admin
    .from("users")
    .update({
      xp: updatedXp,
      level: newLevel,
    })
    .eq("id", post.user_id);

  if (profileUpdateError) {
    console.error("[QuestRewards] Failed to update XP:", profileUpdateError);
    return;
  }

  if (newLevel > oldLevel) {
    await createNotification({
      userId: post.user_id,
      type: "level_up",
      message: `You reached Level ${newLevel} — ${titleForLevel(newLevel)}!`,
      entityId: post.user_id,
      entityType: "user",
    });
  }

  const badge = questData.badge_reward;
  if (badge) {
    const { data: badgeRow } = await admin
      .from("badges")
      .upsert({ name: badge }, { onConflict: "name" })
      .select("id")
      .single();
    if (badgeRow) {
      await admin.from("user_badges").upsert({ user_id: post.user_id, badge_id: badgeRow.id });
    }
  }

  const { data: completedCategories } = await admin
    .from("user_quests")
    .select("quests(category)")
    .eq("user_id", post.user_id)
    .eq("status", "completed");

  const categories = ((completedCategories as Array<{ quests: { category: string } | null }> | null) ?? [])
    .map((row) => row.quests?.category)
    .filter((value): value is string => Boolean(value));

  const aiBadges = recommendBadges(categories);
  if (aiBadges.length > 0) {
    const { data: createdBadges } = await admin
      .from("badges")
      .upsert(aiBadges.map((name) => ({ name })), { onConflict: "name" })
      .select("id,name");

    if (createdBadges) {
      await admin.from("user_badges").upsert(
        createdBadges.map((badgeRow) => ({
          user_id: post.user_id,
          badge_id: badgeRow.id,
        })),
      );
    }
  }
}

export async function voteOnPost(userId: string, postId: string, vote: boolean): Promise<string | undefined> {
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).maybeSingle();
  const postOwnerId = post?.user_id;

  if (!postOwnerId || postOwnerId === userId) {
    return postOwnerId;
  }

  await supabase
    .from("approvals")
    .upsert({ post_id: postId, user_id: userId, vote }, { onConflict: "post_id,user_id" });

  if (vote) {
    const { data: actor } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
    await createNotification({
      userId: postOwnerId,
      type: "approval",
      actorId: userId,
      entityId: postId,
      entityType: "post",
      message: `${actor?.name ?? "Someone"} approved your quest completion`,
    });
  }

  try {
    await checkAndAwardQuestApproval(postId);
  } catch (error) {
    console.error("[QuestRewards] Failed after vote on post:", postId, error);
  }

  return postOwnerId;
}

function normalizeFriendPair(a: string, b: string): { user_1: string; user_2: string } {
  return a < b ? { user_1: a, user_2: b } : { user_1: b, user_2: a };
}

export async function getFriends(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("friendships")
    .select("id,user_1,user_2,users_user_1:users!friendships_user_1_fkey(id,name,avatar,level),users_user_2:users!friendships_user_2_fkey(id,name,avatar,level)")
    .or(`user_1.eq.${userId},user_2.eq.${userId}`);

  const rows = (data as Array<Record<string, unknown>> | null) ?? [];
  return rows.map((row) => {
    const left = row.users_user_1 as { id: string; name: string; avatar: string | null; level: number } | null;
    const right = row.users_user_2 as { id: string; name: string; avatar: string | null; level: number } | null;
    const friend = left?.id === userId ? right : left;

    return {
      friendshipId: row.id as string,
      friendId: friend?.id ?? "",
      friendName: friend?.name ?? "Unknown user",
      friendAvatar: friend?.avatar ?? null,
      friendLevel: friend?.level ?? 1,
    };
  });
}

export async function getFriendStatus(userId: string, otherId: string): Promise<FriendStatus> {
  const relationship = await getFriendRelationship(userId, otherId);
  return relationship.status;
}

export async function getFriendRelationship(
  userId: string,
  otherId: string,
): Promise<{ status: FriendStatus; requestId?: string }> {
  if (userId === otherId) {
    return { status: "none" };
  }

  const supabase = await createSupabaseServerClient();
  const pair = normalizeFriendPair(userId, otherId);

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("user_1", pair.user_1)
    .eq("user_2", pair.user_2)
    .maybeSingle();

  if (friendship) {
    return { status: "friends" };
  }

  const { data: sentRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("sender_id", userId)
    .eq("receiver_id", otherId)
    .eq("status", "pending")
    .maybeSingle();

  if (sentRequest) {
    return { status: "pending_sent", requestId: sentRequest.id };
  }

  const { data: receivedRequest } = await supabase
    .from("friend_requests")
    .select("id")
    .eq("sender_id", otherId)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (receivedRequest) {
    return { status: "pending_received", requestId: receivedRequest.id };
  }

  return { status: "none" };
}

export async function getFriendRequests(userId: string): Promise<{
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}> {
  const supabase = await createSupabaseServerClient();

  const [incomingResult, outgoingResult] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("id,sender_id,receiver_id,status,created_at,sender:users!friend_requests_sender_id_fkey(id,name,avatar)")
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("friend_requests")
      .select("id,sender_id,receiver_id,status,created_at,receiver:users!friend_requests_receiver_id_fkey(id,name,avatar)")
      .eq("sender_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const mapIncoming = (rows: Array<Record<string, unknown>>): FriendRequest[] =>
    rows.map((row) => {
      const sender = row.sender as { id: string; name: string; avatar: string | null } | null;
      return {
        id: row.id as string,
        senderId: row.sender_id as string,
        receiverId: row.receiver_id as string,
        status: row.status as FriendRequest["status"],
        createdAt: row.created_at as string,
        senderName: sender?.name,
        senderAvatar: sender?.avatar,
      };
    });

  const mapOutgoing = (rows: Array<Record<string, unknown>>): FriendRequest[] =>
    rows.map((row) => {
      const receiver = row.receiver as { id: string; name: string; avatar: string | null } | null;
      return {
        id: row.id as string,
        senderId: row.sender_id as string,
        receiverId: row.receiver_id as string,
        status: row.status as FriendRequest["status"],
        createdAt: row.created_at as string,
        receiverName: receiver?.name,
        receiverAvatar: receiver?.avatar,
      };
    });

  return {
    incoming: mapIncoming((incomingResult.data as Array<Record<string, unknown>> | null) ?? []),
    outgoing: mapOutgoing((outgoingResult.data as Array<Record<string, unknown>> | null) ?? []),
  };
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (!receiverId || receiverId === senderId) {
    return;
  }

  const status = await getFriendStatus(senderId, receiverId);
  if (status !== "none") {
    return;
  }

  const supabase = await createSupabaseServerClient();

  // Allow re-sending after a previous rejection
  await supabase
    .from("friend_requests")
    .delete()
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("status", "rejected");

  await supabase.from("friend_requests").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    status: "pending",
  });

  const { data: sender } = await supabase.from("users").select("name").eq("id", senderId).maybeSingle();
  await createNotification({
    userId: receiverId,
    type: "friend_request",
    actorId: senderId,
    entityType: "friend_request",
    message: `${sender?.name ?? "Someone"} sent you a friend request`,
  });
}

export async function acceptFriendRequest(userId: string, requestId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: request } = await supabase
    .from("friend_requests")
    .select("id,sender_id,receiver_id,status")
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (!request) {
    return;
  }

  const pair = normalizeFriendPair(request.sender_id, request.receiver_id);
  await supabase.from("friendships").upsert(pair, { onConflict: "user_1,user_2" });
  await supabase
    .from("friend_requests")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", requestId);

  const { data: receiver } = await supabase.from("users").select("name").eq("id", userId).maybeSingle();
  await createNotification({
    userId: request.sender_id,
    type: "friend_accepted",
    actorId: userId,
    entityType: "friendship",
    message: `${receiver?.name ?? "Someone"} accepted your friend request`,
  });
}

export async function rejectFriendRequest(userId: string, requestId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("friend_requests")
    .update({ status: "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", userId)
    .eq("status", "pending");
}

export async function cancelFriendRequest(userId: string, requestId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId)
    .eq("sender_id", userId)
    .eq("status", "pending");
}

/** @deprecated Use sendFriendRequest instead */
export async function addFriend(userId: string, friendId: string) {
  await sendFriendRequest(userId, friendId);
}

export async function removeFriend(userId: string, friendId: string) {
  const supabase = await createSupabaseServerClient();
  const pair = normalizeFriendPair(userId, friendId);
  await supabase
    .from("friendships")
    .delete()
    .eq("user_1", pair.user_1)
    .eq("user_2", pair.user_2);
}

export async function searchUsers(userId: string, query: string) {
  const supabase = await createSupabaseServerClient();
  const trimmed = query.trim();
  if (!trimmed || !isFullEmailAddress(trimmed)) {
    return [] as Array<{
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      level: number;
      xp: number;
      friendStatus: FriendStatus;
      requestId?: string;
    }>;
  }

  const email = trimmed.toLowerCase();
  const { data } = await supabase
    .from("users")
    .select("id,name,email,avatar,level,xp")
    .neq("id", userId)
    .eq("email", email)
    .limit(1);

  const users = (data as Array<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    level: number;
    xp: number;
  }> | null) ?? [];
  const relationships = await Promise.all(users.map((u) => getFriendRelationship(userId, u.id)));

  return users.map((user, index) => ({
    ...user,
    friendStatus: relationships[index].status,
    requestId: relationships[index].requestId,
  }));
}

export async function getNotifications(userId: string, limit = 20): Promise<Notification[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("id,user_id,type,actor_id,entity_id,entity_type,message,read,created_at,actor:users!notifications_actor_id_fkey(id,name,avatar)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as Notification["type"],
    actor_id: row.actor_id as string | null,
    entity_id: row.entity_id as string | null,
    entity_type: row.entity_type as string | null,
    message: row.message as string,
    read: row.read as boolean,
    created_at: row.created_at as string,
    actor: row.actor as Notification["actor"],
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  return count ?? 0;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("user_id", userId);
}

export async function getPendingLevelUp(userId: string): Promise<LevelUpCelebration | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, message")
    .eq("user_id", userId)
    .eq("type", "level_up")
    .eq("read", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const level = parseLevelFromNotificationMessage(data.message);
  if (!level) {
    return null;
  }

  const definition = getLevelDefinition(level);
  if (!definition) {
    return null;
  }

  return {
    notificationId: data.id,
    level: definition.level,
    previousLevel: Math.max(1, definition.level - 1),
    displayName: definition.displayName,
    rarity: definition.rarity,
    title: definition.title,
    rank: definition.rank,
  };
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export async function getProfileSummary(userId: string): Promise<ProfileSummary> {
  noStore();
  const supabase = await createSupabaseServerClient();
  const [profileResult, badgesResult, completedResult, postsResult, friendsResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("user_badges")
      .select("badge_id,badges(id,name,icon)")
      .eq("user_id", userId),
    supabase
      .from("user_quests")
      .select("id,quests(id,title,category,xp_reward,difficulty)")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("posts")
      .select("id,caption,image_url,created_at,edited_at,edit_count,quests(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .or(`user_1.eq.${userId},user_2.eq.${userId}`),
  ]);

  return {
    profile: (profileResult.data as UserProfile | null) ?? null,
    badges:
      ((badgesResult.data as Array<{ badges: { id: string; name: string; icon: string | null } | null }> | null) ?? [])
        .map((row) => row.badges)
        .filter((value): value is { id: string; name: string; icon: string | null } => Boolean(value)),
    completedQuests:
      ((completedResult.data as Array<{ id: string; quests: Record<string, unknown> | null }> | null) ?? []).filter(
        (row) => Boolean(row.quests),
      ),
    posts: (postsResult.data as Array<Record<string, unknown>> | null) ?? [],
    friendsCount: friendsResult.count ?? 0,
  };
}

function extractStoragePath(imageUrl: string): string | null {
  const marker = "/quest-completions/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return imageUrl.slice(index + marker.length);
}

export async function updatePostImage(
  userId: string,
  postId: string,
  file: File,
  editMetadata: Record<string, unknown>,
) {
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id,user_id,image_url,caption,edit_count")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.user_id !== userId) {
    throw new Error("Post not found or not owned by user.");
  }

  await supabase.from("post_edit_history").insert({
    post_id: postId,
    editor_id: userId,
    previous_image_url: post.image_url,
    previous_caption: post.caption,
    edit_metadata: editMetadata,
  });

  const existingPath = extractStoragePath(post.image_url);
  const extension = file.name.split(".").pop() || "jpg";
  const storagePath = existingPath ?? `${userId}/${postId}/edited-${Date.now()}.${extension}`;

  const upload = await supabase.storage
    .from("quest-completions")
    .upload(storagePath, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const { data: publicData } = supabase.storage.from("quest-completions").getPublicUrl(storagePath);
  const cacheBustedUrl = `${publicData.publicUrl}?v=${Date.now()}`;

  await supabase
    .from("posts")
    .update({
      image_url: cacheBustedUrl,
      edited_at: new Date().toISOString(),
      edit_count: Number(post.edit_count ?? 0) + 1,
    })
    .eq("id", postId)
    .eq("user_id", userId);
}

export async function rollbackPostEdit(userId: string, postId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id,user_id")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!post) {
    throw new Error("Post not found.");
  }

  const { data: history } = await supabase
    .from("post_edit_history")
    .select("id,previous_image_url,previous_caption")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!history) {
    throw new Error("No edit history to rollback.");
  }

  await supabase
    .from("posts")
    .update({
      image_url: history.previous_image_url,
      caption: history.previous_caption ?? "",
      edited_at: new Date().toISOString(),
    })
    .eq("id", postId);

  await supabase.from("post_edit_history").delete().eq("id", history.id);
}
