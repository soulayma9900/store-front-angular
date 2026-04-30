import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';

import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  // 🟢 GET ALL (PAGINATION BACKEND)
  getProducts(
    page: number = 0,
    size: number = 20,
    filters?: {
      name?: string,
      categoryId?: string,
      supplierId?: string
    }
  ): Observable<{ content: Product[]; totalElements: number }> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters?.name) params = params.set('name', filters.name);
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.supplierId) params = params.set('supplierId', filters.supplierId);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => ({
        content: res.content,
        totalElements: res.totalElements
      })),
      catchError(this.handleError)
    );
  }

  // 🟢 GET BY ID
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // 🟢 CREATE
  createProduct(product: any): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product).pipe(
      catchError(this.handleError)
    );
  }

  // 🟢 UPDATE
  updateProduct(id: string, product: any): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product).pipe(
      catchError(this.handleError)
    );
  }

  // 🟢 DELETE
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // 🟡 STOCK ALERTS
  getLowStockAlerts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/alerts/low-stock`).pipe(
      catchError(this.handleError)
    );
  }

  getReorderList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reorder-list`).pipe(
      catchError(this.handleError)
    );
  }

  // 🟡 STOCK ACTIONS
  receiveStock(id: string, data: any) {
    return this.http.post(`${this.apiUrl}/${id}/stock/receive`, data);
  }

  wasteStock(id: string, data: any) {
    return this.http.post(`${this.apiUrl}/${id}/stock/waste`, data);
  }

  adjustStock(id: string, data: any) {
    return this.http.post(`${this.apiUrl}/${id}/stock/adjust`, data);
  }

  // 🔴 ERROR HANDLING
  private handleError(error: HttpErrorResponse) {
    let message = 'Unknown error';

    if (error.status === 0) message = 'Network error';
    else if (error.status === 401) message = 'Unauthorized';
    else if (error.status === 404) message = 'Not found';
    else if (error.status === 500) message = 'Server error';
    else message = `Error ${error.status}`;

    return throwError(() => new Error(message));
  }
}