export const CIRCLE_ROLES = ["organizer", "member", "child"] as const;
export type CircleRole = (typeof CIRCLE_ROLES)[number];

export const PIN_STATUSES = ["wishlist", "visited"] as const;
export type PinStatus = (typeof PIN_STATUSES)[number];

export const MAX_PHOTOS_PER_TRIP = 12;

export function canManageCircle(role: CircleRole): boolean {
  return role === "organizer";
}

export function canInvite(role: CircleRole): boolean {
  return role === "organizer" || role === "member";
}

export function canRemoveMembers(role: CircleRole): boolean {
  return role === "organizer";
}

export function canContribute(role: CircleRole): boolean {
  return role === "organizer" || role === "member" || role === "child";
}

export function canDeleteOthersContent(role: CircleRole): boolean {
  return role === "organizer" || role === "member";
}
