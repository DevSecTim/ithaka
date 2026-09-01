import { nanoid } from "nanoid";

export function id(prefix?: string): string {
  const value = nanoid(16);
  return prefix ? `${prefix}_${value}` : value;
}
