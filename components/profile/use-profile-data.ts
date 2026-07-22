"use client";

import { useEffect, useState } from "react";
import type {
  ImageAsset,
  ManagePost,
  ProfileFormState,
  ProfileUser,
  UserGroupInfo,
  UsernameRequest,
} from "./types";

/**
 * 个人中心数据加载 hook：未登录跳转 /login，
 * 并行拉取 资料(+用户组/用户名申请/头像历史) / 我的文章 / 我的图片。
 */
export function useProfileData() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ displayName: "", email: "", bio: "" });
  const [groups, setGroups] = useState<UserGroupInfo[]>([]);
  const [pendingUsernameRequest, setPendingUsernameRequest] = useState<UsernameRequest | null>(null);
  const [posts, setPosts] = useState<ManagePost[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [avatarHistory, setAvatarHistory] = useState<string[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    let cancelled = false;
    async function loadData() {
      try {
        const [profileRes, postRes, imageRes] = await Promise.all([
          fetch("/api/profile", { headers: authHeaders }),
          fetch("/api/posts?mine=1&limit=100", { headers: authHeaders }),
          fetch("/api/upload", { headers: authHeaders }),
        ]);
        const profileData = await profileRes.json() as { user?: ProfileUser; groups?: UserGroupInfo[]; pendingUsernameRequest?: UsernameRequest | null; avatarHistory?: string[] };
        const postData = await postRes.json() as { posts?: ManagePost[] };
        const imageData = await imageRes.json() as { images?: ImageAsset[] };

        if (!cancelled) {
          setProfile(profileData.user || null);
          setGroups(profileData.groups || []);
          setPendingUsernameRequest(profileData.pendingUsernameRequest || null);
          setAvatarHistory(profileData.avatarHistory || []);
          setPosts(postData.posts || []);
          setImages(imageData.images || []);
          if (profileData.user) {
            setProfileForm({
              displayName: profileData.user.display_name || "",
              email: profileData.user.email || "",
              bio: profileData.user.bio || "",
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const currentGroup = groups.find((group) => group.name === profile?.role) || null;

  return {
    loading,
    profile,
    setProfile,
    profileForm,
    setProfileForm,
    groups,
    currentGroup,
    pendingUsernameRequest,
    setPendingUsernameRequest,
    posts,
    setPosts,
    images,
    setImages,
    avatarHistory,
    setAvatarHistory,
    token,
    authHeaders,
  };
}
