/**
 * @vcomm/access-portal - OAuth Integration System
 */

import * as crypto from 'crypto';
import type { OAuthProviderType, OAuthProviderConfig, OAuthCallbackResult, UserIdentity } from './types';

const OAUTH_ENDPOINTS: Record<OAuthProviderType, { authorize: string; token: string; user: string }> = {
  google: { authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', user: 'https://www.googleapis.com/oauth2/v3/userinfo' },
  github: { authorize: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', user: 'https://api.github.com/user' },
  discord: { authorize: 'https://discord.com/api/oauth2/authorize', token: 'https://discord.com/api/oauth2/token', user: 'https://discord.com/api/users/@me' },
  twitter: { authorize: 'https://twitter.com/i/oauth2/authorize', token: 'https://api.twitter.com/2/oauth2/token', user: 'https://api.twitter.com/2/users/me' },
  microsoft: { authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize', token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token', user: 'https://graph.microsoft.com/v1.0/me' },
  apple: { authorize: 'https://appleid.apple.com/auth/authorize', token: 'https://appleid.apple.com/auth/token', user: '' },
};

const DEFAULT_SCOPES: Record<OAuthProviderType, string[]> = {
  google: ['openid', 'email', 'profile'],
  github: ['read:user', 'user:email'],
  discord: ['identify', 'email'],
  twitter: ['tweet.read', 'users.read'],
  microsoft: ['openid', 'profile', 'email'],
  apple: ['email', 'name'],
};

interface OAuthState {
  state: string;
  codeVerifier?: string;
  redirectUrl: string;
  createdAt: Date;
  expiresAt: Date;
}

export class OAuthManager {
  private providers: Map<OAuthProviderType, OAuthProviderConfig> = new Map();
  private states: Map<string, OAuthState> = new Map();
  private stateSecret: string;

  constructor(stateSecret?: string) {
    this.stateSecret = stateSecret || crypto.randomBytes(32).toString('hex');
  }

  registerProvider(config: OAuthProviderConfig): void {
    if (!config.enabled) return;
    this.providers.set(config.provider, {
      ...config,
      scopes: config.scopes.length > 0 ? config.scopes : DEFAULT_SCOPES[config.provider],
    });
  }

  registerProviders(configs: OAuthProviderConfig[]): void {
    for (const config of configs) this.registerProvider(config);
  }

  getProvider(provider: OAuthProviderType): OAuthProviderConfig | undefined {
    return this.providers.get(provider);
  }

  getRegisteredProviders(): OAuthProviderType[] {
    return Array.from(this.providers.keys());
  }

  getAuthorizationUrl(provider: OAuthProviderType, redirectUrl: string, options?: { scopes?: string[]; prompt?: string }): { url: string; state: string } {
    const config = this.providers.get(provider);
    if (!config) throw new Error(`OAuth provider '${provider}' is not registered`);

    const state = this.generateState();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);

    this.states.set(state, { state, codeVerifier, redirectUrl, createdAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60 * 1000) });

    const endpoints = OAUTH_ENDPOINTS[provider];
    const scopes = options?.scopes || config.scopes;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    if (options?.prompt) params.set('prompt', options.prompt);

    return { url: `${endpoints.authorize}?${params.toString()}`, state };
  }

  async handleCallback(provider: OAuthProviderType, code: string, state: string): Promise<OAuthCallbackResult> {
    const config = this.providers.get(provider);
    if (!config) return { success: false, error: `OAuth provider '${provider}' is not registered` };

    const storedState = this.states.get(state);
    if (!storedState) return { success: false, error: 'Invalid or expired state' };
    if (storedState.expiresAt < new Date()) {
      this.states.delete(state);
      return { success: false, error: 'State has expired' };
    }
    this.states.delete(state);

    try {
      const tokens = await this.exchangeCodeForTokens(provider, code, storedState.codeVerifier || '');
      const userInfo = await this.fetchUserInfo(provider, tokens.accessToken);
      const userIdentity: UserIdentity = {
        id: this.generateUserId(provider, userInfo.id),
        username: userInfo.username || userInfo.email?.split('@')[0] || `user_${userInfo.id}`,
        displayName: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        accountType: 'user',
        status: 'active',
        twoFactorEnabled: false,
        createdAt: new Date(),
      };
      return { success: true, user: userIdentity, isNewUser: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async exchangeCodeForTokens(provider: OAuthProviderType, code: string, codeVerifier: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: Date }> {
    const config = this.providers.get(provider)!;
    const endpoints = OAUTH_ENDPOINTS[provider];
    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });
    const response = await fetch(endpoints.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: params.toString(),
    });
    if (!response.ok) throw new Error(`Token exchange failed: ${await response.text()}`);
    const data = await response.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined };
  }

  private async fetchUserInfo(provider: OAuthProviderType, accessToken: string): Promise<{ id: string; username?: string; name?: string; email?: string; avatar?: string }> {
    if (provider === 'apple') throw new Error('Apple OAuth requires ID token parsing');
    const endpoints = OAUTH_ENDPOINTS[provider];
    const headers: Record<string, string> = { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' };
    if (provider === 'github') headers['User-Agent'] = 'V-COMM-OAuth';
    const response = await fetch(endpoints.user, { headers });
    if (!response.ok) throw new Error(`Failed to fetch user info: ${await response.text()}`);
    return this.parseUserInfo(provider, await response.json() as Record<string, unknown>);
  }

  private parseUserInfo(provider: OAuthProviderType, data: Record<string, unknown>): { id: string; username?: string; name?: string; email?: string; avatar?: string } {
    switch (provider) {
      case 'google': return { id: String(data.sub || data.id || ''), username: String(data.email || '').split('@')[0], name: String(data.name || ''), email: data.email_verified ? String(data.email || '') : undefined, avatar: String(data.picture || '') };
      case 'github': return { id: String(data.id || ''), username: String(data.login || ''), name: String(data.name || data.login || ''), email: String(data.email || ''), avatar: String(data.avatar_url || '') };
      case 'discord': return { id: String(data.id || ''), username: String(data.username || ''), name: String(data.global_name || data.username || ''), email: data.verified ? String(data.email || '') : undefined, avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` : undefined };
      default: return { id: String(data.id || ''), username: String(data.username || data.login || ''), name: String(data.name || ''), email: String(data.email || ''), avatar: String(data.avatar || data.avatar_url || '') };
    }
  }

  private generateState(): string { return crypto.randomBytes(32).toString('base64url'); }
  private generateCodeVerifier(): string { return crypto.randomBytes(32).toString('base64url'); }
  private generateCodeChallenge(verifier: string): string { return crypto.createHash('sha256').update(verifier).digest('base64url'); }
  private generateUserId(provider: OAuthProviderType, providerUserId: string): string { return `user_${crypto.createHash('sha256').update(`${provider}:${providerUserId}`).digest('hex').substring(0, 24)}`; }

  cleanupExpiredStates(): number {
    const now = new Date();
    let cleaned = 0;
    for (const [state, oauthState] of this.states) {
      if (oauthState.expiresAt < now) { this.states.delete(state); cleaned++; }
    }
    return cleaned;
  }
}

export function getProviderDisplayName(provider: OAuthProviderType): string {
  const names: Record<OAuthProviderType, string> = { google: 'Google', github: 'GitHub', discord: 'Discord', twitter: 'Twitter', microsoft: 'Microsoft', apple: 'Apple' };
  return names[provider];
}
