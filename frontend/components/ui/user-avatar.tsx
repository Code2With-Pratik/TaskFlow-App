/* eslint-disable @next/next/no-img-element -- Avatar sources are validated image data URLs. */

import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function UserAvatar({
  name,
  avatar,
  className,
  title,
}: {
  name: string;
  avatar: string | null;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 text-[10px] font-semibold text-brand",
        className,
      )}
      title={title}
    >
      {avatar ? (
        <img alt="" className="size-full object-cover" src={avatar} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
