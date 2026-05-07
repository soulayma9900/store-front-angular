import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {

  // DATA
  categories: Category[] = [];
  pagedCategories: Category[] = [];

  displayedColumns: string[] = ['id', 'name', 'actions'];

  loading = false;
  showForm = false;
  editingId: string | null = null;

  form!: FormGroup;

  // ⭐ PAGINATION (2 ITEMS / PAGE)
  currentPage = 1;
  pageSize = 2;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  // FORM
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  // CREATE
  openCreate(): void {
    this.editingId = null;
    this.form.reset();
    this.showForm = true;
  }

  // EDIT
  openEdit(category: Category): void {
    this.editingId = category.id;
    this.form.patchValue({ name: category.name });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form.reset();
  }

  // SAVE
  submit(): void {
    if (this.form.invalid) return;

    const payload = { name: this.form.value.name };

    if (this.editingId) {
      this.categoryService.updateCategory(this.editingId, payload).subscribe(() => {
        this.snackBar.open('Category updated ✅', 'Close', { duration: 3000 });
        this.cancelForm();
        this.loadCategories();
      });
    } else {
      this.categoryService.createCategory(payload).subscribe(() => {
        this.snackBar.open('Category created ✅', 'Close', { duration: 3000 });
        this.cancelForm();
        this.loadCategories();
      });
    }
  }

  // DELETE
  delete(id: string): void {
    if (!confirm('Delete this category?')) return;

    this.categoryService.deleteCategory(id).subscribe(() => {
      this.snackBar.open('Category deleted 🗑️', 'Close', { duration: 3000 });
      this.loadCategories();
    });
  }

  // LOAD
  loadCategories(): void {
    this.loading = true;

    this.categoryService.getCategories().subscribe({
      next: (data: Category[]) => {
        this.categories = data;

        this.currentPage = 1;
        this.loadPage();

        this.loading = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  // PAGINATION
  loadPage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedCategories = this.categories.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.loadPage();
  }

  get totalPages(): number {
    return Math.ceil(this.categories.length / this.pageSize);
  }
}