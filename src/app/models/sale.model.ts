export interface Sale {
  id:          string;
  productId:   string;
  productName: string | null;
  quantity:    number;
  unitPrice:   number;        // ✅ ajouté
  total:       number;
  saleDate:    string | null;
  note:        string | null;
  performedBy: string | null;
  createdAt:   string | null;
}