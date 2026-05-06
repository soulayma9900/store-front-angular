import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    // ✅ Essaie d'abord via AuthService, sinon directement depuis localStorage
    const token = this.authService.getToken() ?? localStorage.getItem('token');

    // 🛠️ Debug temporaire — supprime ces lignes une fois le problème résolu
    console.log('🔐 Intercepteur déclenché');
    console.log('📍 URL:', request.url);
    console.log('🎟️ Token trouvé:', token ? 'OUI ✅' : 'NON ❌');

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.warn('⚠️ Aucun token disponible pour:', request.url);
    }

    return next.handle(request);
  }
}