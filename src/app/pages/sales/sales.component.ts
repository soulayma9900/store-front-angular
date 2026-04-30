import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleService } from '../../services/sale.service';
import { ProductService } from '../../services/product.service';
import { Sale } from '../../models/sale.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {

  sales: Sale[] = [];
  products: Product[] = [];
  displayedColumns: string[] = ['id', 'productId', 'quantity', 'total'];
  loading = false;
  showForm = false;

  page = 0;
  size = 20;
  totalElements = 0;
  totalRevenue = 0;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSales();
    this.loadProducts();
  }

  private initForm(): void {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      quantity:  [1,  [Validators.required, Validators.min(1)]],
      total:     [0,  [Validators.required, Validators.min(0)]]
    });

    this.form.get('productId')?.valueChanges.subscribe(() => this.autoCalcTotal());
    this.form.get('quantity')?.valueChanges.subscribe(() => this.autoCalcTotal());
  }

  private autoCalcTotal(): void {
    const productId = this.form.get('productId')?.value as string;
    const quantity  = this.form.get('quantity')?.value as number;
    const product   = this.products.find(p => p.id === productId);
    if (product && quantity > 0) {
      this.form.patchValue({ total: product.price * quantity }, { emitEvent: false });
    }
  }

  openCreate(): void {
    this.form.reset({ quantity: 1, total: 0 });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;

    const payload = {
      productId: this.form.value.productId as string,
      quantity:  this.form.value.quantity  as number,
      total:     this.form.value.total     as number
    };

    this.saleService.createSale(payload).subscribe({
      next: () => {
        this.snackBar.open('Sale created ✅', 'Close', { duration: 3000 });
        this.cancelForm();
        this.loadSales();
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
    });
  }

  loadSales(): void {
    this.loading = true;
    this.saleService.getSales(this.page, this.size).subscribe({
      next: (data: { content: Sale[]; totalElements: number }) => {
        this.sales         = data.content;
        this.totalElements = data.totalElements;
        this.totalRevenue  = this.sales.reduce((acc, s) => acc + (s.total ?? 0), 0);
        this.loading       = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      }
    });
  }

  loadProducts(): void {
    this.productService.getProducts(0, 100).subscribe({
      next: (data: { content: Product[]; totalElements: number }) => {
        this.products = data.content;
      },
      error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 })
    });
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : '—';
  }
}