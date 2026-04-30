import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}

  // ─── Called automatically before each protected route ───
  canActivate(): boolean {

    // Step 1: Check if token exists in localStorage
    if (this.authService.isLoggedIn()) {
      // ✅ Token found → allow access
      return true;
    } else {
      // ❌ No token → redirect to login
      console.warn('Access denied — redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}