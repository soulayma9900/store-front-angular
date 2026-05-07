import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Supplier } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<Supplier[]> {
    return this.http
      .get<Supplier[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  getSupplier(id: string): Observable<Supplier> {
    return this.http
      .get<Supplier>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createSupplier(payload: Omit<Supplier, 'id'>): Observable<Supplier> {
    return this.http
      .post<Supplier>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  updateSupplier(
    id: string,
    payload: Omit<Supplier, 'id'>,
  ): Observable<Supplier> {
    return this.http
      .put<Supplier>(`${this.apiUrl}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Unknown error';
    if (error.status === 0) message = 'Network error';
    else if (error.status === 401) message = 'Unauthorized';
    else if (error.status === 403) message = 'Forbidden';
    else if (error.status === 404) message = 'Not found';
    else if (error.status === 500) message = 'Server error';
    else message = `Error ${error.status}`;
    return throwError(() => new Error(message));
  }
}
