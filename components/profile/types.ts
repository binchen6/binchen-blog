export interface ProfileUser {
  id: number;
  username: string;
  email: string;
  display_name: string | null;
  avatar: string | null;
  role: string;
  bio: string | null;
}

export interface UserGroupInfo {
  name: string;
  label: string;
  permissions: string[];
}

export interface UsernameRequest {
  id: number;
  requested_username: string;
  created_at: string;
}

export interface ManagePost {
  id: number;
  title: string;
  slug: string;
  status: "published" | "draft";
  mode: "article" | "moment";
  created_at: string;
  published_at: string | null;
}

export interface ImageAsset {
  id: number;
  url: string;
  filename: string;
  size: number;
  created_at: string;
}

export interface ProfileFormState {
  displayName: string;
  email: string;
  bio: string;
}

export interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
