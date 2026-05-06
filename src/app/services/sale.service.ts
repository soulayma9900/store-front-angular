import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, map, catchError } from 'rxjs';
import { Sale } from '../models/sale.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getSales(page: number = 0, size: number = 20): Observable<{ content: Sale[]; totalElements: number }> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => ({
        content:       res.content       ?? [],
        totalElements: res.totalElements ?? 0
      })),
      catchError(this.handleError)
    );
  }

  createSale(sale: {
    productId: string;
    quantity:  number;
    unitPrice: number;
    saleDate:  string;
    note?:     string | null;
  }): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale).pipe(
      catchError(this.handleError)
    );
  }

  // ─── ERROR HANDLER ✅ affiche le vrai message NestJS ──────
  private handleError(error: HttpErrorResponse) {
    console.error('Backend error:', error.error); // log complet

    let message = 'Unknown error';

    if (error.status === 0) {
      message = 'Network error — backend offline?';
    } else if (error.status === 400) {
      const backendMsg = error.error?.message;
      message = Array.isArray(backendMsg)
        ? backendMsg.join(', ')
        : backendMsg ?? 'Bad Request';
    } else if (error.status === 401) {
      message = 'Unauthorized — check your token';
    } else if (error.status === 404) {
      message = 'Not found';
    } else if (error.status === 500) {
      message = 'Server error';
    } else {
      message = `Error ${error.status}`;
    }

    return throwError(() => new Error(message));
  }
}