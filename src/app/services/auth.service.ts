import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/auth/login';
  private readonly tokenKey = 'access_token';

  constructor(private http: HttpClient) {}

  // ─── Login → POST /auth/login ───────────────────────────
  login(username: string, password: string): Observable<any> {
    const body = {
      username: username,
      password: password,
    };
    return this.http.post(this.apiUrl, body);
  }

  // ─── Save token ─────────────────────────────────────────
  // ⭐ FIX: backend retourne "token" pas "access_token"
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // ─── Get token ──────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // ─── Roles from JWT ────────────────────────────────────
  getRoles(): AppRole[] {
    return this.getPayload()?.roles ?? [];
  }

  hasRole(role: AppRole): boolean {
    return this.getRoles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isStaff(): boolean {
    return this.hasRole('STAFF');
  }

  // ─── Check logged in ────────────────────────────────────
  isLoggedIn(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return token !== null && token !== '';
  }

  // ─── Logout ─────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const json = this.decodeBase64Url(parts[1]);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  private decodeBase64Url(value: string): string {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(base64 + padding);
  }
}

export type AppRole = 'ADMIN' | 'STAFF';

interface JwtPayload {
  sub: string;
  username: string;
  roles?: AppRole[];
  exp?: number;
}
