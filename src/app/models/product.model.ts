export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  categoryId: string;
  primarySupplierId?: string;
  unit?: string;
  imageUrl?: string;
  notes?: string;
  lowStockThreshold?: number;
}