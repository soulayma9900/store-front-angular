import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  displayedColumns = ['id', 'name', 'phone', 'address', 'actions'];
  loading = false;
  showForm = false;
  editingId: string | null = null;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
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
    const payload: any = { name: raw.name as string };
    if (raw.phone) payload.phone = raw.phone;
    if (raw.address) payload.address = raw.address;
    if (raw.notes) payload.notes = raw.notes;

    if (this.editingId !== null) {
      this.supplierService
        .updateSupplier(this.editingId, payload as Omit<Supplier, 'id'>)
        .subscribe({
          next: () => {
            this.snackBar.open('Supplier updated ✅', 'Close', { duration: 3000 });
            this.cancelForm();
            this.loadSuppliers();
          },
          error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 }),
        });
    } else {
      this.supplierService.createSupplier(payload as Omit<Supplier, 'id'>).subscribe({
        next: () => {
          this.snackBar.open('Supplier created ✅', 'Close', { duration: 3000 });
          this.cancelForm();
          this.loadSuppliers();
        },
        error: (err: Error) => this.snackBar.open(err.message, 'Close', { duration: 4000 }),
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

  loadSuppliers(): void {
    this.loading = true;
    this.supplierService.getSuppliers().subscribe({
      next: (data: Supplier[]) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: (err: Error) => {
        this.snackBar.open(err.message, 'Close', { duration: 4000 });
        this.loading = false;
      },
    });
  }
}
