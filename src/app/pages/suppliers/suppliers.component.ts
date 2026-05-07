import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  pagedSuppliers: Supplier[] = []; // ⭐ NEW

  displayedColumns = ['id', 'name', 'phone', 'address', 'actions'];

  loading = false;
  showForm = false;
  editingId: string | null = null;
  form!: FormGroup;
  isAdmin = false;

  // ⭐ PAGINATION FRONT (2 per page)
  currentPage = 1;
  pageSize = 2;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.initForm();
    this.loadSuppliers();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      address: [''],
      notes: [''],
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset();
    this.showForm = true;
  }

  openEdit(s: Supplier): void {
    this.editingId = s.id;
    this.form.patchValue({
      name: s.name,
      phone: (s as any).phone ?? '',
      address: (s as any).address ?? '',
      notes: (s as any).notes ?? '',
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;

    const raw = this.form.value;
    const payload: any = { name: raw.name };

    if (raw.phone) payload.phone = raw.phone;
    if (raw.address) payload.address = raw.address;
    if (raw.notes) payload.notes = raw.notes;

    if (this.editingId !== null) {
      this.supplierService.updateSupplier(this.editingId, payload).subscribe({
        next: () => {
          this.snackBar.open('Supplier updated ✅', 'Close', {
            duration: 3000,
          });
          this.cancelForm();
          this.loadSuppliers();
        },
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
    } else {
      this.supplierService.createSupplier(payload).subscribe({
        next: () => {
          this.snackBar.open('Supplier created ✅', 'Close', {
            duration: 3000,
          });
          this.cancelForm();
          this.loadSuppliers();
        },
        error: (err: Error) =>
          this.snackBar.open(err.message, 'Close', { duration: 4000 }),
      });
    }
  }

  delete(id: string): void {
    if (!confirm('Delete this supplier?')) return;

    this.supplierService.deleteSupplier(id).subscribe({
      next: () => {
        this.snackBar.open('Supplier deleted 🗑️', 'Close', { duration: 3000 });
        this.loadSuppliers();
      },
      error: (err: Error) =>
        this.snackBar.open(err.message, 'Close', { duration: 4000 }),
    });
  }

  // ⭐ LOAD + PAGINATION
  loadSuppliers(): void {
    this.loading = true;

    this.supplierService.getSuppliers().subscribe({
      next: (data: Supplier[]) => {
        this.suppliers = data;

        this.currentPage = 1; // reset page
        this.loadPage();

        this.loading = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  // ⭐ pagination logic
  loadPage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedSuppliers = this.suppliers.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page < 1) return;
    if (page > this.totalPages) return;

    this.currentPage = page;
    this.loadPage();
  }

  get totalPages(): number {
    return Math.ceil(this.suppliers.length / this.pageSize);
  }
}
