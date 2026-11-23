export type SessionProfile = {
  name: string;
  email: string;
  picture?: string;
  method: "google" | "guest";
};

export const SESSION_STORAGE_KEY = "chartdeck.session.v1";
export const BYOK_STORAGE_KEY = "chartdeck.byok.v1";
