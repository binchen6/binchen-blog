"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { EmptyState, PageHeader, SiteShell, SurfacePanel } from "@/components/page-chrome";
import { useDocumentTitle } from "@/lib/use-document-title";
import { GroupInfoModal, GroupRulesPanel } from "@/components/profile/group-info-modal";
import { MyImages } from "@/components/profile/my-images";
import { MyPosts } from "@/components/profile/my-posts";
import { PasswordForm } from "@/components/profile/password-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileHeader } from "@/components/profile/profile-header";
import { UsernameRequestForm } from "@/components/profile/username-request";
import { useProfileData } from "@/components/profile/use-profile-data";
import type { UserGroupInfo } from "@/components/profile/types";

export default function ProfilePage() {
  useDocumentTitle("个人中心");
  const [selectedGroup, setSelectedGroup] = useState<UserGroupInfo | null>(null);
  const {
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
  } = useProfileData();

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-28">
        <PageHeader
          eyebrow="Profile"
          title="个人中心"
          icon={<UserCog size={22} />}
          description="管理个人资料、用户名申请、已发布文章和上传图片。"
        />

        {loading ? (
          <div className="mt-12 ink-loading mx-auto h-1 max-w-md" />
        ) : !profile ? (
          <EmptyState title="未登录" description="请先登录后再进入个人中心。" />
        ) : (
          <div className="mt-12 space-y-8">
            <SurfacePanel className="p-6 md:p-8">
              <ProfileHeader
                profile={profile}
                avatarHistory={avatarHistory}
                currentGroup={currentGroup}
                authHeaders={authHeaders}
                token={token ?? ""}
                onAvatarUpdated={(user, history) => {
                  setProfile(user);
                  setAvatarHistory(history);
                }}
                onSelectGroup={setSelectedGroup}
              />

              <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <ProfileForm
                  form={profileForm}
                  onChange={setProfileForm}
                  authHeaders={authHeaders}
                  token={token ?? ""}
                  onSaved={setProfile}
                />

                <div className="space-y-5">
                  <UsernameRequestForm
                    pendingRequest={pendingUsernameRequest}
                    authHeaders={authHeaders}
                    onRequested={setPendingUsernameRequest}
                  />
                  <PasswordForm authHeaders={authHeaders} />
                  <GroupRulesPanel groups={groups} onSelect={setSelectedGroup} />
                </div>
              </div>
            </SurfacePanel>

            <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)]">
              <MyPosts
                posts={posts}
                authHeaders={authHeaders}
                onDeleted={(slug) => setPosts((current) => current.filter((post) => post.slug !== slug))}
              />
              <MyImages
                images={images}
                authHeaders={authHeaders}
                onDeleted={(id) => setImages((current) => current.filter((image) => image.id !== id))}
              />
            </div>
          </div>
        )}
      </section>

      <GroupInfoModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />
    </SiteShell>
  );
}
