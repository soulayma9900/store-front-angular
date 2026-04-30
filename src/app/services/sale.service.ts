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

  // 🟢 GET SALES (pagination backend)
  getSales(page: number = 0, size: number = 20, productId?: string):
    Observable<{ content: Sale[]; totalElements: number }> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (productId) {
      params = params.set('productId', productId);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => ({
        content: res.content,
        totalElements: res.totalElements
      })),
      catchError(this.handleError)
    );
  }

  // 🟢 CREATE SALE (OK backend)
  createSale(sale: any): Observable<Sale> {
    return this.http.post<Sale>(this.apiUrl, sale).pipe(
      catchError(this.handleError)
    );
  }

  // ❌ SUPPRIMÉ car backend ne supporte pas :
  // getSale, updateSale, deleteSale

  // 🟡 CALCULS (option front only)
  getTotalRevenue(): Observable<number> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const sales: Sale[] = res.content || [];
        return sales.reduce((acc, s) => acc + (s.total ?? 0), 0);
      }),
      catchError(this.handleError)
    );
  }

  getTopSales(minTotal: number): Observable<Sale[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const sales: Sale[] = res.content || [];
        return sales
          .filter(s => s.total > minTotal)
          .sort((a, b) => b.total - a.total);
      }),
      catchError(this.handleError)
    );
  }

  // 🔴 ERROR HANDLING
  private handleError(error: HttpErrorResponse) {
    let message = 'Unknown error';

    if (error.status === 0) message = 'Network error';
    else if (error.status === 401) message = 'Unauthorized (check token)';
    else if (error.status === 404) message = 'Not found';
    else if (error.status === 500) message = 'Server error';
    else message = `Error ${error.status}`;

    return throwError(() => new Error(message));
  }
}