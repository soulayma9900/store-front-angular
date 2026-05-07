export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type RequestType =
  | 'RESTOCK_REQUEST'
  | 'DAMAGE_REPORT'
  | 'PRODUCT_SUGGESTION'
  | 'PRODUCT_NOTE';

export interface ActionRequest {
  id: string;
  type: RequestType;
  status: RequestStatus;
  productId?: string | null;
  payload?: Record<string, any> | null;
  createdBy: string;
  createdAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}
