export interface ShopProfile {
  id: string
  user_id: string
  shop_name: string
  address: string
  phone: string
  created_at: string
}

export interface BillItem {
  id: string
  name: string
  qty: number
  price: number
  discounted_price: number
}

export interface Bill {
  id: string
  user_id: string
  bill_number: string
  customer_name: string
  customer_phone: string
  items: BillItem[]
  subtotal: number
  discount_total: number
  total: number
  note: string
  created_at: string
}
