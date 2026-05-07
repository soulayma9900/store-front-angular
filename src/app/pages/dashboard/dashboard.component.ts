// src/app/components/dashboard/dashboard.component.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SaleService } from '../../services/sale.service';
import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../services/auth.service';
import { RequestService } from '../../services/request.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Sale } from '../../models/sale.model';
import { Supplier } from '../../models/supplier.model';

Chart.register(...registerables);

interface StockBatch {
  id: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  quantityRemaining?: number | null;
  supplierName?: string | null;
}

interface StockMovement {
  id: string;
  delta: number;
  reason: string;
  note?: string | null;
  performedBy?: string | null;
  createdAt?: string | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  products: Product[] = [];
  categories: Category[] = [];
  sales: Sale[] = [];
  suppliers: Supplier[] = [];

  totalProducts: number = 0;
  totalCategories: number = 0;
  totalSales: number = 0;
  totalRevenue: number = 0;
  avgPrice: number = 0;
  topProduct: string = '-';
  expensiveCount: number = 0;
  largeSalesCount: number = 0;

  isAdmin = false;
  isStaff = false;

  stockForm!: FormGroup;
  saleForm!: FormGroup;
  availableBatches: StockBatch[] = [];
  stockMovements: StockMovement[] = [];
  lowStockProducts: Product[] = [];
  monitorProductId: string | null = null;
  movementColumns: string[] = [
    'createdAt',
    'reason',
    'delta',
    'performedBy',
    'note',
  ];

  readonly stockActions = [
    { value: 'restock', label: 'Restock Request' },
    { value: 'damage', label: 'Report Damage / Expiry' },
  ];

  readonly wasteReasons = ['WASTE', 'SPOILAGE'];

  isLoading = true;
  hasError = false;
  errorMsg = '';

  private pieChart?: Chart;
  private barChart?: Chart;
  private pieLabels: string[] = [];
  private pieData: number[] = [];
  private barLabels: string[] = [];
  private barData: number[] = [];
  private viewReady = false;
  private dataReady = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private saleService: SaleService,
    private supplierService: SupplierService,
    private authService: AuthService,
    private requestService: RequestService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isStaff = this.authService.isStaff();
    this.initForms();
    this.loadAllData();
    if (this.isStaff) {
      this.loadSuppliers();
    }
    if (this.isAdmin || this.isStaff) {
      this.loadLowStockAlerts();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) {
      setTimeout(() => this.renderCharts(), 200);
    }
  }

  private initForms(): void {
    this.stockForm = this.fb.group({
      productId: ['', Validators.required],
      action: ['restock', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      costPrice: [null, [Validators.min(0.001)]],
      supplierId: [''],
      lotNumber: [''],
      expiryDate: [''],
      batchId: [''],
      reason: ['WASTE'],
      note: [''],
    });

    this.setStockValidators('receive');

    this.stockForm.get('action')?.valueChanges.subscribe((action) => {
      this.setStockValidators(action);
      if (action === 'restock') {
        this.stockForm.patchValue({ reason: 'WASTE' }, { emitEvent: false });
      }
      if (action === 'damage') {
        this.stockForm.patchValue({ reason: 'WASTE' }, { emitEvent: false });
      }
      this.loadBatchesIfNeeded();
    });

    this.stockForm.get('productId')?.valueChanges.subscribe(() => {
      this.loadBatchesIfNeeded();
    });

    this.saleForm = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      note: [''],
    });

    this.saleForm.get('productId')?.valueChanges.subscribe(() => {
      this.syncSaleUnitPrice();
    });
  }

  private setStockValidators(action: string): void {
    const costPrice = this.stockForm.get('costPrice');
    const batchId = this.stockForm.get('batchId');
    const reason = this.stockForm.get('reason');

    costPrice?.clearValidators();
    batchId?.clearValidators();
    reason?.clearValidators();

    if (action === 'restock') {
      costPrice?.setValidators([Validators.min(0.001)]);
    }
    if (action === 'damage') {
      batchId?.setValidators([Validators.required]);
      reason?.setValidators([Validators.required]);
    }

    costPrice?.updateValueAndValidity();
    batchId?.updateValueAndValidity();
    reason?.updateValueAndValidity();
  }

  private extractArray<T>(response: any): T[] {
    if (response && response.content && Array.isArray(response.content)) {
      return response.content as T[];
    }
    if (Array.isArray(response)) {
      return response as T[];
    }
    return [];
  }

  // ✅ Calcule le total d'une vente (unitPrice × quantity si total absent)
  private getSaleTotal(s: Sale): number {
    if (s.total && s.total > 0) return s.total;
    return Number(s.unitPrice ?? 0) * Number(s.quantity ?? 0);
  }

  loadAllData(): void {
    this.isLoading = true;
    this.hasError = false;

    forkJoin({
      products: this.productService.getProducts(),
      categories: this.categoryService.getCategories(),
      sales: this.saleService.getSales(),
    }).subscribe({
      next: (result: any) => {
        const products: Product[] = this.extractArray<Product>(result.products);
        const categories: Category[] = this.extractArray<Category>(
          result.categories,
        );

        // ✅ FIX — recalcule total pour chaque sale car backend stocke unitPrice × quantity
        const sales: Sale[] = this.extractArray<Sale>(result.sales).map(
          (s) => ({
            ...s,
            total:
              s.total && s.total > 0
                ? s.total
                : Number(s.unitPrice ?? 0) * Number(s.quantity ?? 0),
          }),
        );

        this.products = products;
        this.categories = categories;
        this.sales = sales;

        // ─── Debug ────────────────────────────────────────
        console.log('products:', products);
        console.log('categories:', categories);
        console.log('sales:', sales);
        console.log('sales[0] total:', sales[0]?.total);
        console.log('sales[0] unitPrice:', sales[0]?.unitPrice);
        console.log('sales[0] quantity:', sales[0]?.quantity);

        // ─── map() ────────────────────────────────────────
        const productPrices = products.map((p: Product) => p.price);

        // ─── filter() ─────────────────────────────────────
        this.expensiveCount = products.filter(
          (p: Product) => p.price > 500,
        ).length;
        this.largeSalesCount = sales.filter((s: Sale) => s.total > 1000).length;

        // ─── reduce() ─────────────────────────────────────
        // ✅ FIX — utilise getSaleTotal pour être sûr
        this.totalRevenue = sales.reduce(
          (acc: number, s: Sale) => acc + this.getSaleTotal(s),
          0,
        );
        const totalValue = productPrices.reduce(
          (acc: number, price: number) => acc + price,
          0,
        );

        // ─── stats ────────────────────────────────────────
        this.totalProducts = products.length;
        this.totalCategories = categories.length;
        this.totalSales = sales.length;
        this.avgPrice =
          products.length > 0 ? Math.round(totalValue / products.length) : 0;

        if (products.length > 0) {
          const sorted = [...products].sort((a, b) => b.price - a.price);
          this.topProduct = sorted[0].name;
        }

        // ─── BUILD CHARTS ─────────────────────────────────
        this.buildPieData();
        this.buildBarData();

        this.syncDefaultSelections();

        this.isLoading = false;
        this.dataReady = true;
        this.cdr.detectChanges();

        if (this.viewReady) {
          setTimeout(() => this.renderCharts(), 200);
        }
      },

      error: (err: any) => {
        this.isLoading = false;
        this.hasError = true;
        this.errorMsg =
          err.status === 0
            ? 'Backend offline — démarrer NestJS sur le port 8080.'
            : `Erreur ${err.status}: ${err.message}`;
        console.error('Dashboard error:', err);
      },
    });
  }

  private syncDefaultSelections(): void {
    if (this.products.length === 0) return;

    const defaultProductId = this.products[0].id;

    if (this.isStaff) {
      const stockProductId = this.stockForm.get('productId')?.value;
      if (!stockProductId) {
        this.stockForm.patchValue(
          { productId: defaultProductId },
          { emitEvent: false },
        );
        this.loadBatchesIfNeeded();
      }

      const saleProductId = this.saleForm.get('productId')?.value;
      if (!saleProductId) {
        this.saleForm.patchValue(
          { productId: defaultProductId },
          { emitEvent: false },
        );
        this.syncSaleUnitPrice();
      }
    }

    if (this.isAdmin && !this.monitorProductId) {
      this.monitorProductId = defaultProductId;
      this.loadStockMovements();
    }
  }

  get stockAction(): string {
    return this.stockForm?.get('action')?.value ?? 'receive';
  }

  get quickSaleTotal(): number {
    const qty = Number(this.saleForm?.get('quantity')?.value ?? 0);
    const price = Number(this.saleForm?.get('unitPrice')?.value ?? 0);
    return qty * price;
  }

  private loadSuppliers(): void {
    this.supplierService.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  private loadBatchesIfNeeded(): void {
    if (!this.isStaff) return;
    const action = this.stockForm.get('action')?.value;
    const productId = this.stockForm.get('productId')?.value;

    if (action !== 'damage' || !productId) {
      this.availableBatches = [];
      return;
    }

    this.productService.getBatches(productId, true).subscribe({
      next: (batches) => {
        this.availableBatches = (batches as StockBatch[]) ?? [];
      },
      error: (err: Error) => {
        this.availableBatches = [];
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  private syncSaleUnitPrice(): void {
    const productId = this.saleForm.get('productId')?.value;
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      this.saleForm.patchValue(
        { unitPrice: product.price },
        { emitEvent: false },
      );
    }
  }

  submitStockAction(): void {
    if (!this.isStaff) return;
    if (this.stockForm.invalid) {
      this.snackBar.open('Complete the required stock fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const action = this.stockForm.value.action as string;
    const productId = this.stockForm.value.productId as string;
    const quantity = Number(this.stockForm.value.quantity);
    const note = (this.stockForm.value.note ?? '').trim();

    if (action === 'restock') {
      const payload: any = {
        productId,
        quantity,
      };
      const costPrice = this.stockForm.value.costPrice;
      const supplierId = (this.stockForm.value.supplierId ?? '').trim();
      const lotNumber = (this.stockForm.value.lotNumber ?? '').trim();
      const expiryDate = (this.stockForm.value.expiryDate ?? '').trim();
      if (costPrice !== null && costPrice !== '') payload.costPrice = Number(costPrice);
      if (supplierId) payload.supplierId = supplierId;
      if (lotNumber) payload.lotNumber = lotNumber;
      if (expiryDate) payload.expiryDate = expiryDate;
      if (note) payload.note = note;

      this.requestService.createRestockRequest(payload).subscribe({
        next: () => {
          this.snackBar.open('Restock request sent.', 'Close', { duration: 3000 });
          this.stockForm.patchValue({ quantity: 1, note: '' });
          this.loadAllData();
        },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Close', { duration: 4000 });
        },
      });
      return;
    }

    if (action === 'damage') {
      const payload: any = {
        productId,
        batchId: this.stockForm.value.batchId,
        quantity,
        reason: this.stockForm.value.reason,
      };
      if (note) payload.note = note;

      this.requestService.createDamageReport(payload).subscribe({
        next: () => {
          this.snackBar.open('Damage report sent.', 'Close', { duration: 3000 });
          this.stockForm.patchValue({ quantity: 1, note: '' });
          this.loadAllData();
          this.loadBatchesIfNeeded();
        },
        error: (err: Error) => {
          this.snackBar.open(err.message, 'Close', { duration: 4000 });
        },
      });
    }
  }

  submitQuickSale(): void {
    if (!this.isStaff) return;
    if (this.saleForm.invalid) {
      this.snackBar.open('Complete the required sale fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const payload = {
      productId: this.saleForm.value.productId,
      quantity: Number(this.saleForm.value.quantity),
      unitPrice: Number(this.saleForm.value.unitPrice),
      saleDate: new Date().toISOString(),
      note: (this.saleForm.value.note ?? '').trim() || null,
    };

    this.saleService.createSale(payload).subscribe({
      next: () => {
        this.snackBar.open('Sale recorded.', 'Close', { duration: 3000 });
        this.saleForm.patchValue({ quantity: 1, note: '' });
        this.loadAllData();
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  loadLowStockAlerts(): void {
    this.productService.getLowStockAlerts().subscribe({
      next: (data) => {
        this.lowStockProducts = data ?? [];
      },
      error: (err: Error) => {
        this.lowStockProducts = [];
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  loadStockMovements(): void {
    if (!this.monitorProductId) {
      this.stockMovements = [];
      return;
    }

    this.productService
      .getStockMovements(this.monitorProductId, 0, 20)
      .subscribe({
        next: (data) => {
          this.stockMovements = Array.isArray(data?.content)
            ? (data.content as StockMovement[])
            : [];
        },
        error: (err: Error) => {
          this.stockMovements = [];
          this.snackBar.open(err.message, 'Close', { duration: 4000 });
        },
      });
  }

  // ─── PIE: products per category ───────────────────────────
  private buildPieData(): void {
    console.log('Sample product categoryId:', this.products[0]?.categoryId);
    console.log('Sample category id:', this.categories[0]?.id);

    // ✅ Filtre les catégories qui ont au moins 1 produit
    const categoriesWithProducts = this.categories.filter((c) =>
      this.products.some(
        (p) =>
          String(p.categoryId).trim().toLowerCase() ===
          String(c.id).trim().toLowerCase(),
      ),
    );

    this.pieLabels = categoriesWithProducts.map((c: Category) => c.name);
    this.pieData = categoriesWithProducts.map(
      (c: Category) =>
        this.products.filter(
          (p: Product) =>
            String(p.categoryId).trim().toLowerCase() ===
            String(c.id).trim().toLowerCase(),
        ).length,
    );

    console.log('pieLabels:', this.pieLabels);
    console.log('pieData:', this.pieData);
  }

  // ─── BAR: sales per product ───────────────────────────────
  private buildBarData(): void {
    // ✅ Filtre les produits qui ont au moins 1 vente
    const productsWithSales = this.products.filter((p) =>
      this.sales.some(
        (s) =>
          String(s.productId).trim().toLowerCase() ===
          String(p.id).trim().toLowerCase(),
      ),
    );

    this.barLabels = productsWithSales.map((p: Product) => p.name);
    this.barData = productsWithSales.map((p: Product) =>
      this.sales
        .filter(
          (s: Sale) =>
            String(s.productId).trim().toLowerCase() ===
            String(p.id).trim().toLowerCase(),
        )
        .reduce((acc: number, s: Sale) => acc + this.getSaleTotal(s), 0),
    );

    console.log('barLabels:', this.barLabels);
    console.log('barData:', this.barData); // ← doit afficher [4800, 11250, 450] etc
  }

  // ─── RENDER ───────────────────────────────────────────────
  private renderCharts(): void {
    this.renderPieChart();
    this.renderBarChart();
  }

  private renderPieChart(): void {
    const canvas = this.pieChartRef?.nativeElement;
    if (!canvas) return;
    if (this.pieChart) this.pieChart.destroy();

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: this.pieLabels.length ? this.pieLabels : ['No data'],
        datasets: [
          {
            data: this.pieData.length ? this.pieData : [1],
            backgroundColor: [
              '#4f8ef7',
              '#22c55e',
              '#f97316',
              '#a855f7',
              '#ef4444',
              '#06b6d4',
              '#eab308',
              '#ec4899',
            ],
            borderColor: '#ffffff',
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, padding: 16, color: '#374151' },
          },
        },
      },
    });
  }

  private renderBarChart(): void {
    const canvas = this.barChartRef?.nativeElement;
    if (!canvas) return;
    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.barLabels.length ? this.barLabels : ['No data'],
        datasets: [
          {
            label: 'Total Sales ($)',
            data: this.barData.length ? this.barData : [0],
            backgroundColor: 'rgba(79,142,247,0.85)',
            borderColor: '#3b6fd4',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, color: '#374151' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              callback: (value: any) => '$' + value,
            },
          },
        },
      },
    });
  }

  // ─── HELPERS ──────────────────────────────────────────────
  getCategoryName(categoryId: string): string {
    const found = this.categories.find(
      (c: Category) =>
        String(c.id).toLowerCase() === String(categoryId).toLowerCase(),
    );
    return found ? found.name : '—';
  }

  getProductName(productId: string): string {
    const found = this.products.find(
      (p: Product) =>
        String(p.id).toLowerCase() === String(productId).toLowerCase(),
    );
    return found ? found.name : '—';
  }
}
