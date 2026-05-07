import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { Sale } from '../../models/sale.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
})
export class SalesComponent implements OnInit {
  sales: Sale[] = [];
  pagedSales: Sale[] = [];
  products: Product[] = [];

  displayedColumns: string[] = ['id', 'productId', 'quantity', 'total'];

  loading = false;
  showForm = false;
  totalRevenue = 0;
  isStaff = false;
  isAdmin = false;

  form!: FormGroup;

  currentPage = 1;
  pageSize = 3;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isStaff = this.authService.isStaff();
    this.isAdmin = this.authService.isAdmin();
    this.initForm();
    this.loadSales();
    this.loadProducts();
  }

  private initForm(): void {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      note: [null],
    });

    this.form
      .get('productId')
      ?.valueChanges.subscribe(() => this.autoCalcUnitPrice());
    this.form
      .get('quantity')
      ?.valueChanges.subscribe(() => this.autoCalcUnitPrice());
  }

  private autoCalcUnitPrice(): void {
    const productId = this.form.get('productId')?.value;
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      this.form.patchValue({ unitPrice: product.price }, { emitEvent: false });
    }
  }

  get estimatedTotal(): number {
    const qty = this.form.get('quantity')?.value ?? 0;
    const price = this.form.get('unitPrice')?.value ?? 0;
    return qty * price;
  }

  // ─── LOAD ────────────────────────────────────────────────

  loadSales(): void {
    this.loading = true;

    this.saleService.getSales(0, 1000).subscribe({
      next: (data) => {
        this.sales = data.content;

        // ✅ log temporaire — voir le vrai champ retourné par le backend
        if (this.sales.length) {
          console.log('Sale object from API:', JSON.stringify(this.sales[0]));
        }

        this.totalRevenue = this.sales.reduce((acc, s) => {
          const t =
            s.total ??
            (s as any).totalPrice ??
            (s as any).amount ??
            ((s as any).unitPrice ? s.quantity * (s as any).unitPrice : 0);
          return acc + t;
        }, 0);

        this.currentPage = 1;
        this.loadPage();
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  loadProducts(): void {
    this.productService.getProducts(0, 100).subscribe({
      next: (data: any) => {
        this.products = data.content;
      },
    });
  }

  // ─── PAGINATION ──────────────────────────────────────────

  loadPage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedSales = this.sales.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPage();
  }

  get totalPages(): number {
    return Math.ceil(this.sales.length / this.pageSize);
  }

  // ─── FORM ACTIONS ────────────────────────────────────────

  openCreate(): void {
    if (!this.isStaff) return;
    this.form.reset({ quantity: 1, unitPrice: 0 });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = {
      productId: this.form.value.productId,
      quantity: Number(this.form.value.quantity),
      unitPrice: Number(this.form.value.unitPrice),
      saleDate: new Date().toISOString(),
      note: this.form.value.note ?? null,
    };

    this.saleService.createSale(payload).subscribe({
      next: (created) => {
        console.log('Created sale:', JSON.stringify(created)); // ✅ voir le total retourné
        this.snackBar.open('Sale created ✅', 'Close', { duration: 3000 });
        this.cancelForm();
        this.loadSales();
      },
      error: (err) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  getSaleTotal(s: any): number {
    return (
      s.total ??
      s.totalPrice ??
      s.amount ??
      (s.unitPrice ? s.quantity * s.unitPrice : 0)
    );
  }

  getProductName(productId: string): string {
    const p = this.products.find((x) => x.id === productId);
    return p ? `${p.name} — $${p.price}` : '—';
  }
}
