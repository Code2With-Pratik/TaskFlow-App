"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, Mail, ShieldCheck, Trash2, UserRound } from "@/components/animated-icons";
import { IconHover } from "@/components/icon-hover";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/ui/page-heading";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/app/auth-provider";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { User } from "@/types/api";

const MAX_AVATAR_BYTES = 1_048_576;
const ACCEPTED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must have at least 2 characters").max(80),
  designation: z.string().trim().max(100, "Designation must be 100 characters or fewer"),
});
type ProfileValues = z.infer<typeof profileSchema>;

function readAvatarFile(file: File): Promise<string> {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    return Promise.reject(new Error("Choose a PNG, JPEG, or WebP image."));
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return Promise.reject(new Error("Choose an image smaller than 1 MiB."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The image could not be read. Try another file."));
    };
    reader.onerror = () => reject(new Error("The image could not be read. Try another file."));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [avatarOverride, setAvatarOverride] = useState<string | null>();
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch<User>("/users/me"),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", designation: "" },
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset({
        name: profileQuery.data.name,
        designation: profileQuery.data.designation ?? "",
      });
    }
  }, [profileQuery.data, reset]);
  const avatar = avatarOverride === undefined
    ? profileQuery.data?.avatar ?? null
    : avatarOverride;

  const updateProfile = useMutation({
    mutationFn: (values: ProfileValues) =>
      apiFetch<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: values.name,
          designation: values.designation || null,
          avatar,
        }),
      }),
    onSuccess: async (user) => {
      updateUser(user);
      queryClient.setQueryData(["profile"], user);
      setSuccess(true);
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] !== "profile",
      });
    },
  });

  if (profileQuery.isLoading) return <LoadingState label="Loading your profile…" />;
  if (profileQuery.error) {
    return <ErrorState error={profileQuery.error} onRetry={() => void profileQuery.refetch()} />;
  }
  if (!profileQuery.data) {
    return <ErrorState error={new Error("Profile data is missing.")} onRetry={() => void profileQuery.refetch()} />;
  }
  const profile = profileQuery.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow="Account"
        title="Your profile"
        description="Manage the details your teammates see across TaskFlow."
      />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <UserAvatar
              className="size-14 rounded-2xl text-lg"
              name={profile.name}
              avatar={avatar}
            />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">{profile.name}</h2>
              {profile.designation ? (
                <p className="mt-1 truncate text-sm text-muted">{profile.designation}</p>
              ) : null}
              <p className="mt-1 truncate text-sm text-muted">{profile.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            className="space-y-5"
            onSubmit={handleSubmit((values) => {
              setSuccess(false);
              updateProfile.mutate(values);
            })}
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="profile-name">
                Full name
              </label>
              <Input
                id="profile-name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name ? <p className="mt-1.5 text-xs text-danger-foreground">{errors.name.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="profile-designation">
                Designation
              </label>
              <Input
                id="profile-designation"
                autoComplete="organization-title"
                placeholder="e.g. Product Designer"
                aria-invalid={Boolean(errors.designation)}
                {...register("designation")}
              />
              {errors.designation ? <p className="mt-1.5 text-xs text-danger-foreground">{errors.designation.message}</p> : null}
            </div>
            <div>
              <span className="mb-2 block text-sm font-medium text-foreground">Profile photo</span>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-secondary"
                  htmlFor="profile-avatar"
                >
                  <ImagePlus size={15} />
                  Upload image
                  <input
                    className="sr-only"
                    id="profile-avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      setAvatarError(null);
                      void readAvatarFile(file)
                        .then(setAvatarOverride)
                        .catch((error: unknown) => setAvatarError(getErrorMessage(error)));
                    }}
                  />
                </label>
                {avatar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAvatarOverride(null);
                      setAvatarError(null);
                    }}
                  >
                    <Trash2 size={14} />
                    Remove photo
                  </Button>
                ) : null}
              </div>
              <p className="mt-1.5 text-xs text-muted">PNG, JPEG, or WebP, up to 1 MiB.</p>
              {avatarError ? <p className="mt-1.5 text-xs text-danger-foreground" role="alert">{avatarError}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="profile-email">
                Email address
              </label>
              <IconHover>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <Input
                    className="pl-9"
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    disabled
                    readOnly
                  />
                </div>
              </IconHover>
              <p className="mt-1.5 text-xs text-muted">
                Email changes are not currently supported.
              </p>
            </div>
            {updateProfile.error ? (
              <p className="text-sm text-danger-foreground" role="alert">
                {getErrorMessage(updateProfile.error)}
              </p>
            ) : null}
            {success ? (
              <p className="flex items-center gap-2 text-sm text-success" role="status">
                <Check size={15} /> Your profile was saved.
              </p>
            ) : null}
            <div className="flex justify-end border-t border-border pt-4">
              <Button type="submit" disabled={updateProfile.isPending}>
                <UserRound size={15} />
                {updateProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-success/10 text-success">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Account security</p>
              <p className="mt-1 text-xs text-muted">Member since {formatDate(profile.createdAt)}</p>
            </div>
          </div>
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-medium text-success">
            Protected
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
