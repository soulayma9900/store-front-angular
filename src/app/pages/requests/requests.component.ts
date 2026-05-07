import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { RequestService } from '../../services/request.service';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { SupplierService } from '../../services/supplier.service';
import { ActionRequest, RequestStatus, RequestType } from '../../models/request.model';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { Supplier } from '../../models/supplier.model';

interface StockBatch {
  id: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  quantityRemaining?: number | null;
}

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css'],
})
export class RequestsComponent implements OnInit {
  isAdmin = false;
  isStaff = false;

  requestForm!: FormGroup;

  requests: ActionRequest[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  suppliers: Supplier[] = [];
  availableBatches: StockBatch[] = [];

  loading = false;
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;

  statusFilter: RequestStatus | '' = '';
  typeFilter: RequestType | '' = '';

  readonly requestTypes = [
    { value: 'RESTOCK_REQUEST', label: 'Restock Request' },
    { value: 'DAMAGE_REPORT', label: 'Damage / Expiry Report' },
    { value: 'PRODUCT_SUGGESTION', label: 'New Product Suggestion' },
    { value: 'PRODUCT_NOTE', label: 'Product Note' },
  ];

  readonly unitOptions = ['PIECE', 'KG', 'LITER', 'BOX', 'PACK'];
  readonly wasteReasons = ['WASTE', 'SPOILAGE'];

  displayedColumns: string[] = [
    'createdAt',
    'type',
    'status',
    'product',
    'createdBy',
    'summary',
    'actions',
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private requestService: RequestService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isStaff = this.authService.isStaff();
    this.initForm();
    this.loadLookups();
    this.loadRequests();
  }

  get requestType(): RequestType {
    return this.requestForm.get('type')?.value as RequestType;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalElements / this.pageSize));
  }

  private initForm(): void {
    this.requestForm = this.fb.group({
      type: ['RESTOCK_REQUEST', Validators.required],
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      costPrice: [null, [Validators.min(0.001)]],
      supplierId: [''],
      lotNumber: [''],
      expiryDate: [''],
      batchId: [''],
      reason: ['WASTE'],
      name: [''],
      barcode: [''],
      categoryId: [''],
      primarySupplierId: [''],
      price: [0],
      unit: ['PIECE'],
      lowStockThreshold: [0],
      note: [''],
    });

    this.applyTypeValidators(this.requestType);

    this.requestForm.get('type')?.valueChanges.subscribe((type) => {
      this.applyTypeValidators(type as RequestType);
      this.loadBatchesIfNeeded();
    });

    this.requestForm.get('productId')?.valueChanges.subscribe(() => {
      this.loadBatchesIfNeeded();
    });
  }

  private applyTypeValidators(type: RequestType): void {
    const productId = this.requestForm.get('productId');
    const quantity = this.requestForm.get('quantity');
    const batchId = this.requestForm.get('batchId');
    const reason = this.requestForm.get('reason');
    const name = this.requestForm.get('name');
    const categoryId = this.requestForm.get('categoryId');
    const primarySupplierId = this.requestForm.get('primarySupplierId');
    const price = this.requestForm.get('price');
    const unit = this.requestForm.get('unit');
    const lowStockThreshold = this.requestForm.get('lowStockThreshold');
    const note = this.requestForm.get('note');

    productId?.clearValidators();
    quantity?.clearValidators();
    batchId?.clearValidators();
    reason?.clearValidators();
    name?.clearValidators();
    categoryId?.clearValidators();
    primarySupplierId?.clearValidators();
    price?.clearValidators();
    unit?.clearValidators();
    lowStockThreshold?.clearValidators();
    note?.clearValidators();

    if (type === 'RESTOCK_REQUEST') {
      productId?.setValidators([Validators.required]);
      quantity?.setValidators([Validators.required, Validators.min(0.001)]);
    }

    if (type === 'DAMAGE_REPORT') {
      productId?.setValidators([Validators.required]);
      quantity?.setValidators([Validators.required, Validators.min(0.001)]);
      batchId?.setValidators([Validators.required]);
      reason?.setValidators([Validators.required]);
    }

    if (type === 'PRODUCT_SUGGESTION') {
      name?.setValidators([Validators.required, Validators.minLength(2)]);
      categoryId?.setValidators([Validators.required]);
      primarySupplierId?.setValidators([Validators.required]);
      price?.setValidators([Validators.required, Validators.min(0)]);
      unit?.setValidators([Validators.required]);
      lowStockThreshold?.setValidators([Validators.required, Validators.min(0)]);
    }

    if (type === 'PRODUCT_NOTE') {
      productId?.setValidators([Validators.required]);
      note?.setValidators([Validators.required, Validators.minLength(2)]);
    }

    productId?.updateValueAndValidity();
    quantity?.updateValueAndValidity();
    batchId?.updateValueAndValidity();
    reason?.updateValueAndValidity();
    name?.updateValueAndValidity();
    categoryId?.updateValueAndValidity();
    primarySupplierId?.updateValueAndValidity();
    price?.updateValueAndValidity();
    unit?.updateValueAndValidity();
    lowStockThreshold?.updateValueAndValidity();
    note?.updateValueAndValidity();
  }

  private loadLookups(): void {
    forkJoin({
      products: this.productService.getProducts(0, 200),
      categories: this.categoryService.getCategories(),
      suppliers: this.supplierService.getSuppliers(),
    }).subscribe({
      next: ({ products, categories, suppliers }) => {
        this.products = products.content ?? [];
        this.categories = categories ?? [];
        this.suppliers = suppliers ?? [];
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
      },
    });
  }

  loadRequests(): void {
    this.loading = true;
    const filters = {
      status: this.statusFilter || undefined,
      type: this.typeFilter || undefined,
    };

    this.requestService
      .getRequests(this.currentPage - 1, this.pageSize, filters)
      .subscribe({
        next: ({ content, totalElements }) => {
          this.requests = content;
          this.totalElements = totalElements;
          this.loading = false;
        },
        error: (err: Error) => {
          this.loading = false;
          this.snackBar.open(err.message, 'Close', { duration: 4000 });
        },
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadRequests();
  }

  submitRequest(isDraft: boolean): void {
    if (this.requestForm.invalid) {
      this.snackBar.open('Complete required request fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const type = this.requestType;
    const note = (this.requestForm.value.note ?? '').trim();

    if (type === 'RESTOCK_REQUEST') {
      const payload: any = {
        productId: this.requestForm.value.productId,
        quantity: Number(this.requestForm.value.quantity),
        draft: isDraft,
      };
      const costPrice = this.requestForm.value.costPrice;
      const supplierId = (this.requestForm.value.supplierId ?? '').trim();
      const lotNumber = (this.requestForm.value.lotNumber ?? '').trim();
      const expiryDate = (this.requestForm.value.expiryDate ?? '').trim();

      if (costPrice !== null && costPrice !== '') {
        payload.costPrice = Number(costPrice);
      }
      if (supplierId) payload.supplierId = supplierId;
      if (lotNumber) payload.lotNumber = lotNumber;
      if (expiryDate) payload.expiryDate = expiryDate;
      if (note) payload.note = note;

      this.requestService.createRestockRequest(payload).subscribe({
        next: () => this.afterSubmit('Restock request sent.'),
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
      return;
    }

    if (type === 'DAMAGE_REPORT') {
      const payload: any = {
        productId: this.requestForm.value.productId,
        batchId: this.requestForm.value.batchId,
        quantity: Number(this.requestForm.value.quantity),
        reason: this.requestForm.value.reason,
        draft: isDraft,
      };
      if (note) payload.note = note;

      this.requestService.createDamageReport(payload).subscribe({
        next: () => this.afterSubmit('Damage report sent.'),
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
      return;
    }

    if (type === 'PRODUCT_SUGGESTION') {
      const payload: any = {
        name: this.requestForm.value.name,
        barcode: (this.requestForm.value.barcode ?? '').trim() || null,
        categoryId: this.requestForm.value.categoryId,
        primarySupplierId: this.requestForm.value.primarySupplierId,
        price: Number(this.requestForm.value.price),
        unit: this.requestForm.value.unit,
        lowStockThreshold: Number(this.requestForm.value.lowStockThreshold),
        draft: isDraft,
      };
      const imageUrl = (this.requestForm.value.imageUrl ?? '').trim();
      if (imageUrl) payload.imageUrl = imageUrl;
      if (note) payload.notes = note;

      this.requestService.createProductSuggestion(payload).subscribe({
        next: () => this.afterSubmit('Product suggestion sent.'),
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
      return;
    }

    if (type === 'PRODUCT_NOTE') {
      const payload: any = {
        productId: this.requestForm.value.productId,
        note: note,
        draft: isDraft,
      };

      this.requestService.createProductNote(payload).subscribe({
        next: () => this.afterSubmit('Product note sent.'),
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
    }
  }

  submitDraft(id: string): void {
    this.requestService.submitRequest(id).subscribe({
      next: () => {
        this.snackBar.open('Draft submitted.', 'Close', { duration: 3000 });
        this.loadRequests();
      },
      error: (err: Error) =>
        this.snackBar.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  approve(request: ActionRequest): void {
    const reviewNote = prompt('Review note (optional)');
    this.requestService.approveRequest(request.id, reviewNote ?? null).subscribe({
      next: () => {
        this.snackBar.open('Request approved.', 'Close', { duration: 3000 });
        this.loadRequests();
      },
      error: (err: Error) =>
        this.snackBar.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  reject(request: ActionRequest): void {
    const reviewNote = prompt('Rejection note (optional)');
    this.requestService.rejectRequest(request.id, reviewNote ?? null).subscribe({
      next: () => {
        this.snackBar.open('Request rejected.', 'Close', { duration: 3000 });
        this.loadRequests();
      },
      error: (err: Error) =>
        this.snackBar.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.typeFilter = '';
    this.currentPage = 1;
    this.loadRequests();
  }

  getProductName(id?: string | null): string {
    if (!id) return '-';
    return this.products.find((p) => p.id === id)?.name ?? '-';
  }

  getRequestSummary(request: ActionRequest): string {
    const payload = request.payload ?? {};

    if (request.type === 'RESTOCK_REQUEST') {
      const qty = payload['quantity'] ?? '-';
      const cost = payload['costPrice'] ?? 'n/a';
      return `Qty ${qty}, Cost ${cost}`;
    }

    if (request.type === 'DAMAGE_REPORT') {
      const qty = payload['quantity'] ?? '-';
      const batch = payload['batchId'] ?? '-';
      return `Batch ${batch}, Qty ${qty}`;
    }

    if (request.type === 'PRODUCT_SUGGESTION') {
      const name = payload['name'] ?? 'New product';
      return `Suggestion: ${name}`;
    }

    if (request.type === 'PRODUCT_NOTE') {
      return payload['note'] ?? 'Note';
    }

    return '-';
  }

  getTypeLabel(type: RequestType): string {
    return this.requestTypes.find((t) => t.value === type)?.label ?? type;
  }

  private loadBatchesIfNeeded(): void {
    if (this.requestType !== 'DAMAGE_REPORT') {
      this.availableBatches = [];
      return;
    }

    const productId = this.requestForm.get('productId')?.value;
    if (!productId) {
      this.availableBatches = [];
      return;
    }

    this.productService.getBatches(productId, true).subscribe({
      next: (batches) => {
        this.availableBatches = (batches as StockBatch[]) ?? [];
      },
      error: () => {
        this.availableBatches = [];
      },
    });
  }

  private afterSubmit(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.requestForm.patchValue({
      quantity: 1,
      costPrice: null,
      lotNumber: '',
      expiryDate: '',
      batchId: '',
      note: '',
    });
    this.loadRequests();
  }
}
