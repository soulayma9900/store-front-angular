import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username:     string  = '';
  password:     string  = '';
  errorMessage: string  = '';
  isLoading:    boolean = false;

  constructor(
    private authService: AuthService,
    private router:      Router
  ) {}

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({

      next: (response: any) => {
        console.log('Login success:', response);
        console.log('Token:', response.token);

        // ⭐ FIX: backend retourne "token" pas "access_token"
        this.authService.saveToken(response.token);

        // Redirect to dashboard
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },

      error: (err: any) => {
        console.error('Login error:', err);

        if (err.status === 401) {
          this.errorMessage = 'Wrong username or password.';
        } else if (err.status === 0) {
          this.errorMessage = 'Cannot connect to server. Is the backend running?';
        } else if (err.status === 403) {
          this.errorMessage = 'Access denied.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }

        this.isLoading = false;
      }
    });
  }
}