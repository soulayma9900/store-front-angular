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

  categories: Category[] = [];
  displayedColumns: string[] = ['id', 'name', 'actions'];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset();
    this.showForm = true;
  }

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

  submit(): void {
    if (this.form.invalid) return;
    const payload = { name: this.form.value.name as string };

    if (this.editingId !== null) {
      this.categoryService.updateCategory(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Category updated ✅', 'Close', { duration: 3000 });
          this.cancelForm();
          this.loadCategories();
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.snackBar.open('Category created ✅', 'Close', { duration: 3000 });
          this.cancelForm();
          this.loadCategories();
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Delete this category?')) return;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.snackBar.open('Category deleted 🗑️', 'Close', { duration: 3000 });
        this.loadCategories();
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (data: Category[]) => {
        this.categories = data;
        this.loading = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }
}