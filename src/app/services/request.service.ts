import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActionRequest, RequestStatus, RequestType } from '../models/request.model';

@Injectable({
  providedIn: 'root',
})
export class RequestService {
  private readonly apiUrl = `${environment.apiUrl}/requests`;

  constructor(private http: HttpClient) {}

  getRequests(
    page: number = 0,
    size: number = 20,
    filters?: {
      status?: RequestStatus;
      type?: RequestType;
      productId?: string;
    },
  ): Observable<{ content: ActionRequest[]; totalElements: number }> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.productId) params = params.set('productId', filters.productId);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((res) => ({
        content: res.content ?? [],
        totalElements: res.totalElements ?? 0,
      })),
      catchError(this.handleError),
    );
  }

  createRestockRequest(payload: {
    productId: string;
    quantity: number;
    supplierId?: string | null;
    costPrice?: number | null;
    lotNumber?: string | null;
    expiryDate?: string | null;
    note?: string | null;
    draft?: boolean;
  }): Observable<ActionRequest> {
    return this.http
      .post<ActionRequest>(`${this.apiUrl}/restock`, payload)
      .pipe(catchError(this.handleError));
  }

  createDamageReport(payload: {
    productId: string;
    batchId: string;
    quantity: number;
    reason: string;
    note?: string | null;
    draft?: boolean;
  }): Observable<ActionRequest> {
    return this.http
      .post<ActionRequest>(`${this.apiUrl}/damage`, payload)
      .pipe(catchError(this.handleError));
  }

  createProductSuggestion(payload: {
    name: string;
    barcode?: string | null;
    categoryId: string;
    primarySupplierId: string;
    price: number;
    unit: string;
    imageUrl?: string | null;
    notes?: string | null;
    lowStockThreshold: number;
    draft?: boolean;
  }): Observable<ActionRequest> {
    return this.http
      .post<ActionRequest>(`${this.apiUrl}/product-suggestion`, payload)
      .pipe(catchError(this.handleError));
  }

  createProductNote(payload: {
    productId: string;
    note: string;
    draft?: boolean;
  }): Observable<ActionRequest> {
    return this.http
      .post<ActionRequest>(`${this.apiUrl}/product-note`, payload)
      .pipe(catchError(this.handleError));
  }

  submitRequest(id: string): Observable<ActionRequest> {
    return this.http
      .patch<ActionRequest>(`${this.apiUrl}/${id}/submit`, {})
      .pipe(catchError(this.handleError));
  }

  approveRequest(id: string, reviewNote?: string | null): Observable<ActionRequest> {
    return this.http
      .patch<ActionRequest>(`${this.apiUrl}/${id}/approve`, { reviewNote })
      .pipe(catchError(this.handleError));
  }

  rejectRequest(id: string, reviewNote?: string | null): Observable<ActionRequest> {
    return this.http
      .patch<ActionRequest>(`${this.apiUrl}/${id}/reject`, { reviewNote })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Unknown error';

    if (error.status === 0) message = 'Network error';
    else if (error.status === 400) {
      const backendMsg = error.error?.message;
      message = Array.isArray(backendMsg)
        ? backendMsg.join(', ')
        : (backendMsg ?? 'Bad Request');
    } else if (error.status === 401) message = 'Unauthorized';
    else if (error.status === 403) message = 'Forbidden';
    else if (error.status === 404) message = 'Not found';
    else if (error.status === 500) message = 'Server error';
    else message = `Error ${error.status}`;

    return throwError(() => new Error(message));
  }
}
