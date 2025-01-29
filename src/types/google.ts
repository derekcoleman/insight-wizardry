export interface GoogleOAuthData {
  access_token: string;
  email: string;
  timestamp: number;
  refresh_token?: string;
}

export interface GoogleAccount {
  id: string;
  name: string;
}

export interface ConversionGoal {
  id: string;
  name: string;
}