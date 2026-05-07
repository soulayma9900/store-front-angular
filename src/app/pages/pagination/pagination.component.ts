import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {

  @Input() totalItems: number = 0;
  @Input() pageSize: number = 5;
  @Input() currentPage: number = 1;

  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];

  ngOnChanges(): void {
    const totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.pages.length) return;
    this.currentPage = page;
    this.pageChange.emit(this.currentPage);
  }
}