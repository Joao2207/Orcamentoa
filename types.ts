
export enum ProductMode {
  SIMPLE = 'SIMPLE',
  COMPLETE = 'COMPLETE'
}

export enum QuoteStatus {
  PENDING = 'Pendente',
  NEGOTIATING = 'Em negociação',
  APPROVED = 'Aprovado',
  PRODUCTION = 'Produção iniciada',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado'
}

export enum PDFTheme {
  SIMPLE = 'Simples',
  ELEGANT = 'Elegante',
  MINIMALIST = 'Minimalista'
}

export interface CompanySettings {
  id?: number;
  companyName: string;
  ownerName: string;
  phone: string;
  email?: string;
  logoBase64?: string;
  defaultObservations: string;
  productMode: ProductMode;
  pdfTheme: PDFTheme;
  password?: string;
  pin?: string;
  shippingRatePerKm?: number;
  originAddress?: string;
}

export interface Category {
  id?: number;
  name: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  costPrice?: number;
  description?: string;
  unit?: string;
  photoBase64?: string;
  categoryId?: number;
  active: boolean;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  anniversaryDate?: string;
  observations?: string;
  address?: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
  };
}

export interface QuoteItem {
  productId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit?: string;
}

export interface Quote {
  id?: number;
  customerId: number;
  customerName: string;
  date: string;
  validity: string;
  deliveryDate?: string; // Campo para encomendas no calendário
  items: QuoteItem[];
  discount: number;
  shippingFee: number;
  shippingDistance?: number;
  total: number;
  observations: string;
  status: QuoteStatus;
  attachments?: string[];
}

export interface CalendarNote {
  id?: number;
  date: string; // ISO YYYY-MM-DD
  text: string;
}

export interface Order {
  id?: number;
  quoteId?: number;
  customerId: number;
  customerName: string;
  items: QuoteItem[];
  total: number;
  deliveryDate: string;
  status: 'Pendente' | 'Produzindo' | 'Pronto' | 'Entregue' | 'Cancelado';
  observations?: string;
}
