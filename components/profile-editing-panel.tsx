"use client";

import { memo, useState } from "react";
import { Shield } from "lucide-react";
import { GroupInfoModal, GroupRulesPanel } from "@/components/profile/group-info-modal";
import { MyImages } from "@/components/profile/my-images";
import { MyPosts } from "@/components/profile/my-posts";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileHeader } from "@/components/profile/profile-header";
import { UsernameRequestForm } from "@/components/profile/username-request";
import type { UserGroupInfo } from "@/components/profile/types";
import { SurfacePanel } from "@/components/page-chrome";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 上层 page.tsx 用 any，这里保持一致避免协变/逆变冲突
interface ProfileEditingPanelProps {
  profile: any;
  setProfile: (u: any) => void;
  profileForm: any;
  setProfileForm: (f: any) => void;
  groups: UserGroupInfo[];
  currentGroup: UserGroupInfo | null;
  pendingUsernameRequest: any;
  setPendingUsernameRequest: (r: any) => void;
  posts: any[];
  setPosts: (p: any[]) => void;
  images: any[];
  setImages: (i: any[]) => void;
  avatarHistory: string[];
  setAvatarHistory: (h: string[]) => void;
  token: string | null;
  authHeaders: Record<string, string>;
}

/** 个人中心编辑面板 — 嵌入用户主页（仅自己可见） */
function ProfileEditingPanelInner(props: ProfileEditingPanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<UserGroupInfo | null>(null);

  return (
    <>
      <SurfacePanel className="p-6 md:p-8">
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-cyan-dark">
          <Shield size={16} />
          编辑个人资料
        </div>

        <ProfileHeader
          profile={props.profile}
          avatarHistory={props.avatarHistory}
          currentGroup={props.currentGroup}
          authHeaders={props.authHeaders}
          token={props.token ?? ""}
          onAvatarUpdated={(user, history) => {
            props.setProfile(user);
            props.setAvatarHistory(history);
          }}
          onSelectGroup={setSelectedGroup}
        />

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ProfileForm
            form={props.profileForm}
            onChange={props.setProfileForm}
            authHeaders={props.authHeaders}
            token={props.token ?? ""}
            onSaved={props.setProfile}
          />

          <div className="space-y-5">
            <UsernameRequestForm
              pendingRequest={props.pendingUsernameRequest}
              authHeaders={props.authHeaders}
              onRequested={props.setPendingUsernameRequest}
            />
            <PasswordForm authHeaders={props.authHeaders} />
            <GroupRulesPanel groups={props.groups} onSelect={setSelectedGroup} />
          </div>
        </div>
      </SurfacePanel>

      <div className="mt-8 grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <MyPosts
          posts={props.posts}
          authHeaders={props.authHeaders}
          onDeleted={(slug) => props.setPosts(props.posts.filter((p: any) => p.slug !== slug))}
        />
        <MyImages
          images={props.images}
          authHeaders={props.authHeaders}
          onDeleted={(id) => props.setImages(props.images.filter((i: any) => i.id !== id))}
        />
      </div>

      <GroupInfoModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
    </>
  );
}

export const ProfileEditingPanel = memo(ProfileEditingPanelInner);
