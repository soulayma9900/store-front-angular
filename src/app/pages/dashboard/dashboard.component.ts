// src/app/components/dashboard/dashboard.component.ts

import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SaleService } from '../../services/sale.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Sale } from '../../models/sale.model';

Chart.register(...registerables);

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

  totalProducts: number = 0;
  totalCategories: number = 0;
  totalSales: number = 0;
  totalRevenue: number = 0;
  avgPrice: number = 0;
  topProduct: string = '—';
  expensiveCount: number = 0;
  largeSalesCount: number = 0;

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
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.dataReady) {
      setTimeout(() => this.renderCharts(), 200);
    }
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
        const categories: Category[] = this.extractArray<Category>(result.categories);

        // ✅ FIX — recalcule total pour chaque sale car backend stocke unitPrice × quantity
        const sales: Sale[] = this.extractArray<Sale>(result.sales).map(s => ({
          ...s,
          total: s.total && s.total > 0
            ? s.total
            : Number(s.unitPrice ?? 0) * Number(s.quantity ?? 0)
        }));

        this.products   = products;
        this.categories = categories;
        this.sales      = sales;

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
        this.expensiveCount  = products.filter((p: Product) => p.price > 500).length;
        this.largeSalesCount = sales.filter((s: Sale) => s.total > 1000).length;

        // ─── reduce() ─────────────────────────────────────
        // ✅ FIX — utilise getSaleTotal pour être sûr
        this.totalRevenue = sales.reduce(
          (acc: number, s: Sale) => acc + this.getSaleTotal(s), 0
        );
        const totalValue = productPrices.reduce(
          (acc: number, price: number) => acc + price, 0
        );

        // ─── stats ────────────────────────────────────────
        this.totalProducts    = products.length;
        this.totalCategories  = categories.length;
        this.totalSales       = sales.length;
        this.avgPrice         = products.length > 0
          ? Math.round(totalValue / products.length)
          : 0;

        if (products.length > 0) {
          const sorted     = [...products].sort((a, b) => b.price - a.price);
          this.topProduct  = sorted[0].name;
        }

        // ─── BUILD CHARTS ─────────────────────────────────
        this.buildPieData();
        this.buildBarData();

        this.isLoading  = false;
        this.dataReady  = true;
        this.cdr.detectChanges();

        if (this.viewReady) {
          setTimeout(() => this.renderCharts(), 200);
        }
      },

      error: (err: any) => {
        this.isLoading  = false;
        this.hasError   = true;
        this.errorMsg   = err.status === 0
          ? 'Backend offline — démarrer NestJS sur le port 8080.'
          : `Erreur ${err.status}: ${err.message}`;
        console.error('Dashboard error:', err);
      },
    });
  }

  // ─── PIE: products per category ───────────────────────────
  private buildPieData(): void {
    console.log('Sample product categoryId:', this.products[0]?.categoryId);
    console.log('Sample category id:', this.categories[0]?.id);

    // ✅ Filtre les catégories qui ont au moins 1 produit
    const categoriesWithProducts = this.categories.filter(c =>
      this.products.some(p =>
        String(p.categoryId).trim().toLowerCase() ===
        String(c.id).trim().toLowerCase()
      )
    );

    this.pieLabels = categoriesWithProducts.map((c: Category) => c.name);
    this.pieData   = categoriesWithProducts.map((c: Category) =>
      this.products.filter(
        (p: Product) =>
          String(p.categoryId).trim().toLowerCase() ===
          String(c.id).trim().toLowerCase()
      ).length
    );

    console.log('pieLabels:', this.pieLabels);
    console.log('pieData:', this.pieData);
  }

  // ─── BAR: sales per product ───────────────────────────────
  private buildBarData(): void {
    // ✅ Filtre les produits qui ont au moins 1 vente
    const productsWithSales = this.products.filter(p =>
      this.sales.some(s =>
        String(s.productId).trim().toLowerCase() ===
        String(p.id).trim().toLowerCase()
      )
    );

    this.barLabels = productsWithSales.map((p: Product) => p.name);
    this.barData   = productsWithSales.map((p: Product) =>
      this.sales
        .filter((s: Sale) =>
          String(s.productId).trim().toLowerCase() ===
          String(p.id).trim().toLowerCase()
        )
        .reduce((acc: number, s: Sale) => acc + this.getSaleTotal(s), 0)
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
        datasets: [{
          data: this.pieData.length ? this.pieData : [1],
          backgroundColor: [
            '#4f8ef7', '#22c55e', '#f97316',
            '#a855f7', '#ef4444', '#06b6d4',
            '#eab308', '#ec4899',
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
        }],
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
        datasets: [{
          label: 'Total Sales ($)',
          data: this.barData.length ? this.barData : [0],
          backgroundColor: 'rgba(79,142,247,0.85)',
          borderColor: '#3b6fd4',
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }],
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
      (c: Category) => String(c.id).toLowerCase() === String(categoryId).toLowerCase()
    );
    return found ? found.name : '—';
  }

  getProductName(productId: string): string {
    const found = this.products.find(
      (p: Product) => String(p.id).toLowerCase() === String(productId).toLowerCase()
    );
    return found ? found.name : '—';
  }
}