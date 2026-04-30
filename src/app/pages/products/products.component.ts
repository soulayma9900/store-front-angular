import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {

  products: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];

  displayedColumns: string[] = [
    'id', 'name', 'barcode', 'price', 'unit',
    'categoryId', 'primarySupplierId', 'lowStockThreshold', 'actions'
  ];
  loading  = false;
  showForm = false;
  editingId: string | null = null;

  page          = 0;
  size          = 20;
  totalElements = 0;

  readonly unitOptions = ['PIECE', 'KG', 'LITER', 'BOX', 'PACK'];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  // ─── Form ────────────────────────────────────────────────────────────────

  private initForm(): void {
    this.form = this.fb.group({
      name:              ['', [Validators.required, Validators.minLength(2)]],
      barcode:           ['', Validators.required],
      categoryId:        ['', Validators.required],
      primarySupplierId: ['', Validators.required],
      price:             [null, [Validators.required, Validators.min(0)]],
      unit:              ['PIECE', Validators.required],
      imageUrl:          [''],
      notes:             [''],
      lowStockThreshold: [null, [Validators.required, Validators.min(0)]]
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ unit: 'PIECE' });
    this.showForm = true;
  }

  openEdit(product: Product): void {
    this.editingId = product.id;
    this.form.patchValue({
      name:              product.name,
      barcode:           product.barcode,
      categoryId:        product.categoryId,
      primarySupplierId: product.primarySupplierId,
      price:             product.price,
      unit:              product.unit,
      imageUrl:          product.imageUrl,
      notes:             product.notes,
      lowStockThreshold: product.lowStockThreshold
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm  = false;
    this.editingId = null;
    this.form.reset({ unit: 'PIECE' });
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = {
      name:              this.form.value.name              as string,
      barcode:           this.form.value.barcode           as string,
      categoryId:        this.form.value.categoryId        as string,
      primarySupplierId: this.form.value.primarySupplierId as string,
      price:             this.form.value.price             as number,
      unit:              this.form.value.unit              as string,
      imageUrl:          this.form.value.imageUrl          as string,
      notes:             this.form.value.notes             as string,
      lowStockThreshold: this.form.value.lowStockThreshold as number
    };

    if (this.editingId !== null) {
      this.productService.updateProduct(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Product updated ✅', 'Close', { duration: 3000 });
          this.cancelForm();
          this.loadProducts();
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => {
          this.snackBar.open('Product created ✅', 'Close', { duration: 3000 });
          this.cancelForm();
          this.loadProducts();
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
      });
    }
  }

  // ─── Data loading ────────────────────────────────────────────────────────

  /** Initial load: fetch categories, suppliers, and products in parallel.
   *  Only renders once all three are ready — fixes the empty mat-select bug. */
  private loadData(): void {
    this.loading = true;
    forkJoin({
      categories: this.categoryService.getCategories(),
      suppliers:  this.supplierService.getSuppliers(),
      products:   this.productService.getProducts(this.page, this.size)
    }).subscribe({
      next: ({ categories, suppliers, products }) => {
        this.categories    = categories;
        this.suppliers     = suppliers;
        this.products      = products.content;
        this.totalElements = products.totalElements;
        this.loading       = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  /** Refresh only the product list after create / update / delete. */
  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts(this.page, this.size).subscribe({
      next: (data: { content: Product[]; totalElements: number }) => {
        this.products      = data.content;
        this.totalElements = data.totalElements;
        this.loading       = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this product?')) return;
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.snackBar.open('Product deleted 🗑️', 'Close', { duration: 3000 });
        this.loadProducts();
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getCategoryName(categoryId: string): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : '—';
  }

  getSupplierName(supplierId: string): string {
    const sup = this.suppliers.find(s => s.id === supplierId);
    return sup ? sup.name : '—';
  }
}