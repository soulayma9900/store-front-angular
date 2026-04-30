import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  static getCategories(): Category[] {
    throw new Error('Method not implemented.');
  }
  private readonly apiUrl = `${environment.apiUrl}/categories`;
  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl).pipe(catchError(this.handleError));
  }
  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }
  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category).pipe(catchError(this.handleError));
  }
  updateCategory(id: string, category: Omit<Category, 'id'>): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category).pipe(catchError(this.handleError));
  }
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Unknown error';
    if (error.status === 0) message = 'Network error';
    else if (error.status === 404) message = 'Category not found';
    else if (error.status === 500) message = 'Server error';
    else message = `Error ${error.status}`;
    return throwError(() => new Error(message));
  }
}