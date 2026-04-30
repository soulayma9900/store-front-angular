import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

private apiUrl = 'http://localhost:8080/auth/login';

  constructor(private http: HttpClient) {}

  // ─── Login → POST /auth/login ───────────────────────────
  login(username: string, password: string): Observable<any> {
    const body = {
      username: username,
      password: password
    };
    return this.http.post(this.apiUrl, body);
  }

  // ─── Save token ─────────────────────────────────────────
  // ⭐ FIX: backend retourne "token" pas "access_token"
  saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  // ─── Get token ──────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ─── Check logged in ────────────────────────────────────
  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return token !== null && token !== '';
  }

  // ─── Logout ─────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('access_token');
  }
}