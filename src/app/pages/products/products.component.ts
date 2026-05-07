import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';

import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  // ───────── DATA ─────────
  products: Product[] = [];
  pagedProducts: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];

  // ───────── PAGINATION FRONT ─────────
  currentPage = 1;
  pageSize = 3; // ⭐ 2 ou 3 items par page

  get totalPages(): number {
    return Math.ceil(this.products.length / this.pageSize);
  }

  // ───────── UI ─────────
  displayedColumns: string[] = [
    'id',
    'name',
    'barcode',
    'price',
    'unit',
    'categoryId',
    'primarySupplierId',
    'lowStockThreshold',
    'actions',
  ];

  loading = false;
  showForm = false;
  editingId: string | null = null;
  isAdmin = false;

  form!: FormGroup;

  readonly unitOptions = ['PIECE', 'KG', 'LITER', 'BOX', 'PACK'];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.displayedColumns = this.isAdmin
      ? [
          'id',
          'name',
          'barcode',
          'price',
          'unit',
          'categoryId',
          'primarySupplierId',
          'lowStockThreshold',
          'actions',
        ]
      : [
          'id',
          'name',
          'barcode',
          'price',
          'unit',
          'categoryId',
          'primarySupplierId',
          'lowStockThreshold',
        ];
    this.initForm();
    this.loadData();
  }

  // ───────── FORM ─────────
  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      barcode: ['', Validators.required],
      categoryId: ['', Validators.required],
      primarySupplierId: ['', Validators.required],
      price: [0, Validators.required],
      unit: ['PIECE', Validators.required],
      lowStockThreshold: [0, Validators.required],
      notes: [''],
    });
  }

  // ───────── LOAD DATA ─────────
  private loadData(): void {
    this.loading = true;

    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories(),
      suppliers: this.supplierService.getSuppliers(),
    }).subscribe({
      next: ({ products, categories, suppliers }) => {
        this.products = products.content;
        this.categories = categories;
        this.suppliers = suppliers;

        this.currentPage = 1;
        this.loadPage();

        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  // ───────── PAGINATION ─────────
  loadPage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedProducts = this.products.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;
    this.loadPage();
  }

  // ───────── CRUD ─────────
  openCreate(): void {
    if (!this.isAdmin) return;
    this.editingId = null;
    this.form.reset({ unit: 'PIECE' });
    this.showForm = true;
  }

  openEdit(p: Product): void {
    if (!this.isAdmin) return;
    this.editingId = p.id;
    this.form.patchValue(p);
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.form.reset({ unit: 'PIECE' });
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.editingId) {
      this.productService
        .updateProduct(this.editingId, payload)
        .subscribe(() => {
          this.cancelForm();
          this.loadData();
        });
    } else {
      this.productService.createProduct(payload).subscribe(() => {
        this.cancelForm();
        this.loadData();
      });
    }
  }

  delete(id: string): void {
    this.productService.deleteProduct(id).subscribe({
      next: () => this.loadData(),
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  // ───────── HELPERS ─────────
  getCategoryName(id: string): string {
    return this.categories.find((c) => c.id === id)?.name || '—';
  }

  getSupplierName(id: string): string {
    return this.suppliers.find((s) => s.id === id)?.name || '—';
  }
}
