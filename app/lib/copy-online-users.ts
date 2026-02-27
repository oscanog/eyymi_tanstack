import { copyCarouselAvatars, type CopyCarouselAvatar } from "../../data/copy-carousel";
import type { OnlineUser } from "@/hooks/useOnlineUsers";

export interface CopyCarouselUser extends OnlineUser {
  avatar: CopyCarouselAvatar;
}

const copyAvatarById = new Map(copyCarouselAvatars.map((avatar) => [avatar.id, avatar]));

function normalizeUsername(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function isCopyCarouselSelfUser(
  user: Pick<OnlineUser, "_id" | "username">,
  selfUserId: string | null,
  selfUsername: string | null
): boolean {
  if (selfUserId && user._id === selfUserId) {
    return true;
  }

  const normalizedSelfUsername = normalizeUsername(selfUsername);
  if (!normalizedSelfUsername) {
    return false;
  }

  return normalizeUsername(user.username) === normalizedSelfUsername;
}

export function resolveCopyCarouselAvatar(avatarId: string | undefined, seed: string): CopyCarouselAvatar {
  if (avatarId) {
    const direct = copyAvatarById.get(avatarId);
    if (direct) {
      return direct;
    }
  }

  const fallbackIndex = hashString(seed) % copyCarouselAvatars.length;
  return copyCarouselAvatars[fallbackIndex] ?? copyCarouselAvatars[0];
}

export function buildCopyCarouselUsers(
  users: OnlineUser[],
  selfUserId: string | null,
  selfUsername: string | null
): CopyCarouselUser[] {
  return users
    .filter((user) => !isCopyCarouselSelfUser(user, selfUserId, selfUsername))
    .map((user) => ({
      ...user,
      avatar: resolveCopyCarouselAvatar(user.avatarId, `${user._id}:${user.username}`),
    }));
}
