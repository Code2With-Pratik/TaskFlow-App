"use client";

import type { AriaAttributes, ComponentType } from "react";
import { Activity01 } from "@/components/animate-ui/icons/hugeicons/activity-01";
import { Airplay } from "@/components/animate-ui/icons/hugeicons/airplay";
import { ArrowLeft01 } from "@/components/animate-ui/icons/hugeicons/arrow-left-01";
import { ArrowRight01 } from "@/components/animate-ui/icons/hugeicons/arrow-right-01";
import { Calendar } from "@/components/animate-ui/icons/hugeicons/calendar";
import { CalendarClock } from "@/components/animate-ui/icons/hugeicons/calendar-clock";
import { Check } from "@/components/animate-ui/icons/hugeicons/check";
import { CheckCheck } from "@/components/animate-ui/icons/hugeicons/check-check";
import { CheckmarkCircle02 } from "@/components/animate-ui/icons/hugeicons/checkmark-circle-02";
import { CircleCheckBig } from "@/components/animate-ui/icons/hugeicons/circle-check-big";
import { CirclePlus } from "@/components/animate-ui/icons/hugeicons/circle-plus";
import { CircleX } from "@/components/animate-ui/icons/hugeicons/circle-x";
import { ClipboardCheck } from "@/components/animate-ui/icons/hugeicons/clipboard-check";
import { ClipboardList } from "@/components/animate-ui/icons/hugeicons/clipboard-list";
import { Clock03 } from "@/components/animate-ui/icons/hugeicons/clock-03";
import { EyeOff } from "@/components/animate-ui/icons/hugeicons/eye-off";
import { FolderOpen } from "@/components/animate-ui/icons/hugeicons/folder-open";
import { GalleryHorizontal } from "@/components/animate-ui/icons/hugeicons/gallery-horizontal";
import { Kanban } from "@/components/animate-ui/icons/hugeicons/kanban";
import { LayoutDashboard } from "@/components/animate-ui/icons/hugeicons/layout-dashboard";
import { List } from "@/components/animate-ui/icons/hugeicons/list";
import { Mail01 } from "@/components/animate-ui/icons/hugeicons/mail-01";
import { Menu01 } from "@/components/animate-ui/icons/hugeicons/menu-01";
import { MessageCircle } from "@/components/animate-ui/icons/hugeicons/message-circle";
import { MessageSquareText } from "@/components/animate-ui/icons/hugeicons/message-square-text";
import { Moon02 } from "@/components/animate-ui/icons/hugeicons/moon-02";
import { Notification01 } from "@/components/animate-ui/icons/hugeicons/notification-01";
import { PencilEdit02 } from "@/components/animate-ui/icons/hugeicons/pencil-edit-02";
import { PlusSign } from "@/components/animate-ui/icons/hugeicons/plus-sign";
import { Refresh } from "@/components/animate-ui/icons/hugeicons/refresh";
import { Search01 } from "@/components/animate-ui/icons/hugeicons/search-01";
import { SendHorizontal } from "@/components/animate-ui/icons/hugeicons/send-horizontal";
import { Settings02 } from "@/components/animate-ui/icons/hugeicons/settings-02";
import { ShieldCheck } from "@/components/animate-ui/icons/hugeicons/shield-check";
import { SlidersHorizontal } from "@/components/animate-ui/icons/hugeicons/sliders-horizontal";
import { SquareArrowOutUpRight } from "@/components/animate-ui/icons/hugeicons/square-arrow-out-up-right";
import { Sun03 } from "@/components/animate-ui/icons/hugeicons/sun-03";
import { Trash } from "@/components/animate-ui/icons/hugeicons/trash";
import { TriangleAlert } from "@/components/animate-ui/icons/hugeicons/triangle-alert";
import { UserRound } from "@/components/animate-ui/icons/hugeicons/user-round";
import { Users } from "@/components/animate-ui/icons/hugeicons/users";
import { View } from "@/components/animate-ui/icons/hugeicons/view";
import { Loading01 } from "@/components/animate-ui/icons/hugeicons/loading-01";

export type AnimatedIconProps = {
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: AriaAttributes["aria-hidden"];
};

type InteractiveIcon = ComponentType<
  AnimatedIconProps & {
    animateOnHover?: boolean;
    animateOnTap?: boolean;
  }
>;

export type AnimatedIcon = ComponentType<AnimatedIconProps>;

function withCursorAnimation(Icon: InteractiveIcon): AnimatedIcon {
  return function AnimatedIconComponent({
    size,
    strokeWidth,
    className,
    "aria-hidden": ariaHidden,
  }: AnimatedIconProps) {
    return (
      <Icon
        animateOnHover
        animateOnTap
        aria-hidden={ariaHidden}
        className={className}
        size={size}
        strokeWidth={strokeWidth}
      />
    );
  };
}

const Activity = withCursorAnimation(Activity01);
const AnimatedAirplay = withCursorAnimation(Airplay);
const AnimatedArrowLeft = withCursorAnimation(ArrowLeft01);
const AnimatedArrowRight = withCursorAnimation(ArrowRight01);
const AnimatedCalendar = withCursorAnimation(Calendar);
const AnimatedCalendarClock = withCursorAnimation(CalendarClock);
const AnimatedCheck = withCursorAnimation(Check);
const AnimatedCheckCheck = withCursorAnimation(CheckCheck);
const AnimatedCheckmarkCircle = withCursorAnimation(CheckmarkCircle02);
const AnimatedCircleCheck = withCursorAnimation(CircleCheckBig);
const AnimatedCirclePlus = withCursorAnimation(CirclePlus);
const AnimatedCircleX = withCursorAnimation(CircleX);
const AnimatedClipboardCheck = withCursorAnimation(ClipboardCheck);
const AnimatedClipboardList = withCursorAnimation(ClipboardList);
const AnimatedClock = withCursorAnimation(Clock03);
const AnimatedEyeOff = withCursorAnimation(EyeOff);
const AnimatedFolder = withCursorAnimation(FolderOpen);
const AnimatedGallery = withCursorAnimation(GalleryHorizontal);
const AnimatedKanban = withCursorAnimation(Kanban);
const AnimatedLayoutDashboard = withCursorAnimation(LayoutDashboard);
const AnimatedList = withCursorAnimation(List);
const AnimatedMail = withCursorAnimation(Mail01);
const AnimatedMenu = withCursorAnimation(Menu01);
const AnimatedMessageCircle = withCursorAnimation(MessageCircle);
const AnimatedMessageSquare = withCursorAnimation(MessageSquareText);
const AnimatedMoon = withCursorAnimation(Moon02);
const AnimatedNotification = withCursorAnimation(Notification01);
const AnimatedPencil = withCursorAnimation(PencilEdit02);
const AnimatedPlus = withCursorAnimation(PlusSign);
const AnimatedRefresh = withCursorAnimation(Refresh);
const AnimatedSearch = withCursorAnimation(Search01);
const AnimatedSend = withCursorAnimation(SendHorizontal);
const AnimatedSettings = withCursorAnimation(Settings02);
const AnimatedShield = withCursorAnimation(ShieldCheck);
const AnimatedSliders = withCursorAnimation(SlidersHorizontal);
const AnimatedExternalLink = withCursorAnimation(SquareArrowOutUpRight);
const AnimatedSun = withCursorAnimation(Sun03);
const AnimatedTrash = withCursorAnimation(Trash);
const AnimatedTriangleAlert = withCursorAnimation(TriangleAlert);
const AnimatedUser = withCursorAnimation(UserRound);
const AnimatedUsers = withCursorAnimation(Users);
const AnimatedView = withCursorAnimation(View);
const AnimatedLoading = withCursorAnimation(Loading01);

export {
  Activity as CircleDashed,
  AnimatedAirplay as Monitor,
  AnimatedArrowLeft as ArrowLeft,
  AnimatedArrowRight as ArrowRight,
  AnimatedCalendar as CalendarDays,
  AnimatedCalendarClock as CalendarClock,
  AnimatedCheck as Check,
  AnimatedCheckCheck as CheckCheck,
  AnimatedCheckmarkCircle as CheckCircle2,
  AnimatedCircleCheck as CircleCheck,
  AnimatedCirclePlus as CirclePlus,
  AnimatedCircleX as X,
  AnimatedClipboardCheck as CheckSquare,
  AnimatedClipboardList as ListTodo,
  AnimatedClock as Clock3,
  AnimatedEyeOff as EyeOff,
  AnimatedFolder as FolderPlus,
  AnimatedGallery as ImagePlus,
  AnimatedKanban as FolderKanban,
  AnimatedKanban as Workflow,
  AnimatedLayoutDashboard as LayoutDashboard,
  AnimatedList as List,
  AnimatedMail as Mail,
  AnimatedMenu as Menu,
  AnimatedMessageCircle as MessageCircle,
  AnimatedMessageSquare as MessageSquare,
  AnimatedMessageSquare as MessageSquareText,
  AnimatedMoon as Moon,
  AnimatedNotification as Bell,
  AnimatedPencil as Pencil,
  AnimatedPlus as Plus,
  AnimatedRefresh as RefreshCw,
  AnimatedSearch as Search,
  AnimatedSend as Send,
  AnimatedSettings as Settings2,
  AnimatedShield as ShieldCheck,
  AnimatedSliders as SlidersHorizontal,
  AnimatedExternalLink as ArrowUpRight,
  AnimatedExternalLink as ExternalLink,
  AnimatedSun as Sun,
  AnimatedTrash as Trash2,
  AnimatedTriangleAlert as AlertCircle,
  AnimatedTriangleAlert as AlertTriangle,
  AnimatedTriangleAlert as TriangleAlert,
  AnimatedUser as UserRound,
  AnimatedUser as UserRoundPlus,
  AnimatedUsers as Users,
  AnimatedView as Eye,
  AnimatedLoading as LoaderCircle,
};
