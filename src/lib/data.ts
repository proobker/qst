import type { User } from "@supabase/supabase-js";
import { DEFAULT_HOBBIES } from "@/lib/constants";
import { levelFromXp } from "@/lib/leveling";
import { generateQuest, moderateQuest, recommendBadges } from "@/lib/ai";
import { QuestDefinition, UserProfile } from "@/lib/types";
import { percentFromVotes } from "@/lib/utils";
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

  const selectedHobbies = selected
    .map((row) => row.hobbies?.name)
    .filter((name): name is string => Boolean(name));

  return {
    selectedHobbies,
    locationEnabled: profile?.location_enabled ?? false,
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
    complete: selectedHobbies.length > 0 && (profile?.location_enabled ?? false),
  };
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
}

async function getUserQuestHistory(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_quests")
    .select("quests(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return ((data as Array<{ quests: { title: string } | null }> | null) ?? [])
    .map((row) => row.quests?.title)
    .filter((title): title is string => Boolean(title));
}

export async function getDiscoveryQuest(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: generatedAssignment } = await supabase
    .from("user_quests")
    .select("id, quest_id, status, quests(*)")
    .eq("user_id", userId)
    .eq("status", "generated")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (generatedAssignment?.quests) {
    return generatedAssignment as {
      id: string;
      quest_id: string;
      status: string;
      quests: QuestDefinition & { id: string };
    };
  }

  const [profile, onboarding, history] = await Promise.all([
    getProfile(userId),
    getOnboardingState(userId),
    getUserQuestHistory(userId),
  ]);

  if (!profile) {
    return null;
  }

  const generated = await generateQuest({
    hobbies: onboarding.selectedHobbies,
    location: { latitude: onboarding.latitude, longitude: onboarding.longitude },
    level: profile.level,
    previousQuestTitles: history,
  });

  const safeQuest = moderateQuest(generated) ? generated : await generateQuest({
    hobbies: ["Exploration"],
    location: { latitude: onboarding.latitude, longitude: onboarding.longitude },
    level: 1,
    previousQuestTitles: history,
  });

  const { data: insertedQuest } = await supabase
    .from("quests")
    .insert({
      creator_ai: true,
      title: safeQuest.title,
      description: safeQuest.description,
      difficulty: safeQuest.difficulty,
      xp_reward: safeQuest.xp_reward,
      badge_reward: safeQuest.badge_reward,
      estimated_time: safeQuest.estimated_time,
      category: safeQuest.category,
    })
    .select("*")
    .single();

  if (!insertedQuest) {
    return null;
  }

  const { data: assignment } = await supabase
    .from("user_quests")
    .insert({
      user_id: userId,
      quest_id: (insertedQuest as { id: string }).id,
      status: "generated",
    })
    .select("id, quest_id, status, quests(*)")
    .single();

  return assignment as {
    id: string;
    quest_id: string;
    status: string;
    quests: QuestDefinition & { id: string };
  };
}

export async function swipeQuest(userId: string, userQuestId: string, direction: "left" | "right") {
  const supabase = await createSupabaseServerClient();
  const status = direction === "right" ? "accepted" : "rejected";

  const payload =
    direction === "right"
      ? { status, swiped_at: new Date().toISOString(), started_at: new Date().toISOString() }
      : { status, swiped_at: new Date().toISOString(), rejected_at: new Date().toISOString() };

  await supabase.from("user_quests").update(payload).eq("id", userQuestId).eq("user_id", userId);
}

export async function listUserQuests(userId: string) {
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

export async function getFeed(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id,caption,image_url,created_at,user_id,quest_id,users(id,name,avatar),quests(id,title,difficulty,xp_reward,category),likes(id,user_id),approvals(id,user_id,vote)",
    )
    .order("created_at", { ascending: false });

  const posts = (data as Array<Record<string, unknown>> | null) ?? [];
  return posts.map((post) => {
    const likes = ((post.likes as Array<{ user_id: string }> | undefined) ?? []).length;
    const approvals = (post.approvals as Array<{ user_id: string; vote: boolean }> | undefined) ?? [];
    const approved = approvals.filter((vote) => vote.vote).length;
    const approvalPercent = percentFromVotes(approved, approvals.length);
    const likedByUser = approvals.some(() => false)
      ? false
      : ((post.likes as Array<{ user_id: string }> | undefined) ?? []).some((like) => like.user_id === userId);
    const votedByUser = approvals.find((vote) => vote.user_id === userId) ?? null;

    return {
      ...post,
      likesCount: likes,
      approvalsCount: approvals.length,
      approvalPercent,
      likedByUser,
      votedByUser: votedByUser?.vote ?? null,
    };
  });
}

async function awardQuestRewards(postId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: post } = await supabase
    .from("posts")
    .select("id,user_id,quest_id,quests(xp_reward,badge_reward,category)")
    .eq("id", postId)
    .maybeSingle();

  if (!post || !post.quests) {
    return;
  }

  const { data: assignment } = await supabase
    .from("user_quests")
    .select("id,status")
    .eq("user_id", post.user_id)
    .eq("quest_id", post.quest_id)
    .maybeSingle();

  if (!assignment || assignment.status === "completed") {
    return;
  }

  await supabase
    .from("user_quests")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", assignment.id);

  const { data: profile } = await supabase.from("users").select("xp").eq("id", post.user_id).maybeSingle();
  const currentXp = Number(profile?.xp ?? 0);
  const rewardXp = Number((post.quests as { xp_reward: number }).xp_reward ?? 0);
  const updatedXp = currentXp + rewardXp;

  await supabase
    .from("users")
    .update({
      xp: updatedXp,
      level: levelFromXp(updatedXp),
    })
    .eq("id", post.user_id);

  const badge = (post.quests as { badge_reward: string | null }).badge_reward;
  if (badge) {
    const { data: badgeRow } = await supabase
      .from("badges")
      .upsert({ name: badge }, { onConflict: "name" })
      .select("id")
      .single();
    if (badgeRow) {
      await supabase.from("user_badges").upsert({ user_id: post.user_id, badge_id: badgeRow.id });
    }
  }

  const { data: completedCategories } = await supabase
    .from("user_quests")
    .select("quests(category)")
    .eq("user_id", post.user_id)
    .eq("status", "completed");

  const categories = ((completedCategories as Array<{ quests: { category: string } | null }> | null) ?? [])
    .map((row) => row.quests?.category)
    .filter((value): value is string => Boolean(value));

  const aiBadges = recommendBadges(categories);
  if (aiBadges.length > 0) {
    const { data: createdBadges } = await supabase
      .from("badges")
      .upsert(aiBadges.map((name) => ({ name })), { onConflict: "name" })
      .select("id,name");

    if (createdBadges) {
      await supabase.from("user_badges").upsert(
        createdBadges.map((badgeRow) => ({
          user_id: post.user_id,
          badge_id: badgeRow.id,
        })),
      );
    }
  }
}

export async function toggleLike(userId: string, postId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return;
  }

  await supabase.from("likes").insert({ post_id: postId, user_id: userId });
}

export async function voteOnPost(userId: string, postId: string, vote: boolean) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("approvals")
    .upsert({ post_id: postId, user_id: userId, vote }, { onConflict: "post_id,user_id" });

  const { data: votes } = await supabase.from("approvals").select("vote").eq("post_id", postId);
  const total = (votes ?? []).length;
  const approved = (votes ?? []).filter((row) => row.vote).length;

  if (total > 0 && percentFromVotes(approved, total) >= 50) {
    await awardQuestRewards(postId);
  }
}

function normalizeFriendPair(a: string, b: string): { user_1: string; user_2: string } {
  return a < b ? { user_1: a, user_2: b } : { user_1: b, user_2: a };
}

export async function getFriends(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("friendships")
    .select("id,user_1,user_2,users_user_1:users!friendships_user_1_fkey(id,name,avatar),users_user_2:users!friendships_user_2_fkey(id,name,avatar)")
    .or(`user_1.eq.${userId},user_2.eq.${userId}`);

  const rows = (data as Array<Record<string, unknown>> | null) ?? [];
  return rows.map((row) => {
    const left = row.users_user_1 as { id: string; name: string; avatar: string | null } | null;
    const right = row.users_user_2 as { id: string; name: string; avatar: string | null } | null;
    const friend = left?.id === userId ? right : left;

    return {
      friendshipId: row.id as string,
      friendId: friend?.id ?? "",
      friendName: friend?.name ?? "Unknown user",
      friendAvatar: friend?.avatar ?? null,
    };
  });
}

export async function searchUsers(userId: string, query: string) {
  const supabase = await createSupabaseServerClient();
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const { data } = await supabase
    .from("users")
    .select("id,name,email,avatar,level,xp")
    .neq("id", userId)
    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
    .limit(10);

  return (data as Array<Record<string, unknown>> | null) ?? [];
}

export async function addFriend(userId: string, friendId: string) {
  if (!friendId || friendId === userId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const pair = normalizeFriendPair(userId, friendId);
  await supabase.from("friendships").upsert(pair, { onConflict: "user_1,user_2" });
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

export async function getProfileSummary(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [profileResult, badgesResult, completedResult, postsResult] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("user_badges")
      .select("badge_id,badges(id,name,icon)")
      .eq("user_id", userId),
    supabase
      .from("user_quests")
      .select("id,quests(id,title,category,xp_reward)")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("posts")
      .select("id,caption,image_url,created_at,quests(title)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
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
  };
}
