import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaginationService {

  paginate<T>(items: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }

  getTotalPages(totalItems: number, pageSize: number): number[] {
    const totalPages = Math.ceil(totalItems / pageSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}