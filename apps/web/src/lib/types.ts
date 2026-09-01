export type CircleRole = "organizer" | "member" | "child";
export type PinStatus = "wishlist" | "visited";

export type Member = {
  id?: string;
  userId: string;
  name: string;
  email?: string;
  image?: string | null;
  role?: CircleRole;
};

export type Circle = {
  id: string;
  name: string;
  role: CircleRole;
  plan?: string;
  members: Member[];
};

export type Pin = {
  id: string;
  circleId: string;
  lat: number;
  lng: number;
  placeName: string;
  countryCode?: string | null;
  status: PinStatus;
  note?: string | null;
  createdBy: string;
  coverUrl?: string | null;
  wishes?: Member[];
  trips?: Trip[];
};

export type Trip = {
  id: string;
  pinId: string;
  startDate?: string | null;
  endDate?: string | null;
  note?: string | null;
  coverPhotoId?: string | null;
  coverUrl?: string | null;
  travelers: Member[];
  photos: Photo[];
  pin?: { id: string; placeName: string; lat: number; lng: number };
};

export type Photo = {
  id: string;
  url: string;
  caption?: string | null;
  storageKey?: string;
};

export type Place = {
  placeName: string;
  lat: number;
  lng: number;
  countryCode?: string;
};
