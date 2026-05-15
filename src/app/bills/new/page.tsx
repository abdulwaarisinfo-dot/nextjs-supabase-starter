'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { BillItem, ShopProfile } from '@/types'

function genBillNumber() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(Math.floor(Math.random() * 9000) + 1000)}`
}

function genId() {
  return Math.random().toString(36).slice(2, 9)
}

function formatPKR(n: number) {
  return 'PKR ' + n.toLocaleString('en-PK')
}

export default function NewBillPage() {
  const router = useRouter()
  const [shop, setShop] = useState<ShopProfile | null>(null)
  const [billNumber] = useState(genBillNumber)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<BillItem[]>([
    { id: genId(), name: '', qty: 1, price: 0, discounted_price: 0 }
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      supabase.from('shop_profiles').select('*').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (!data) { router.push('/setup'); return }
          setShop(data)
        })
    })
  }, [router])

  const updateItem = useCallback((id: string, field: keyof BillItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'price' && updated.discounted_price === 0) {
        updated.discounted_price = Number(value)
      }
      return updated
    }))
  }, [])

  const addItem = () => setItems(prev => [...prev, { id: genId(), name: '', qty: 1, price: 0, discounted_price: 0 }])
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const total = items.reduce((s, i) => s + (i.discounted_price || i.price) * i.qty, 0)
  const saved = subtotal - total

  async function handleSave() {
    if (!shop) return
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data, error: err } = await supabase.from('bills').insert({
      user_id: user.id,
      bill_number: billNumber,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      items,
      subtotal,
      discount_total: saved,
      total,
      note: note.trim(),
    }).select().single()

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push(`/bills/${data.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E5E5E7] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[#0066CC] text-[14px] font-medium">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Bills
          </Link>
          <p className="text-[14px] font-semibold text-[#1D1D1F]">New Bill</p>
          <button
            onClick={handleSave}
            disabled={saving || items.every(i => !i.name)}
            className="btn-primary !py-2 !px-4 !text-[14px]"
          >
            {saving ? 'Saving…' : 'Save & Export'}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 fade-up">

        {error && (
          <div className="text-[13px] text-[#FF3B30] bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Bill info */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#F5F5F7] flex items-center justify-between">
            <p className="text-[13px] font-semibold text-[#1D1D1F]">Bill Details</p>
            <span className="text-[12px] font-mono text-[#6E6E73] bg-[#F5F5F7] px-3 py-1 rounded-lg">#{billNumber}</span>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label block mb-2">Customer Name</label>
              <input type="text" className="input-field" placeholder="e.g. Mrs. Fatima"
                value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label block mb-2">Customer Phone</label>
              <input type="tel" className="input-field" placeholder="03xx-xxxxxxx"
                value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[#F5F5F7]">
            <p className="text-[13px] font-semibold text-[#1D1D1F]">Items</p>
          </div>

          <div className="divide-y divide-[#F5F5F7]">
            {items.map((item, idx) => (
              <div key={item.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#AEAEB2] font-medium">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)}
                      className="text-[12px] text-[#FF3B30] hover:underline">
                      Remove
                    </button>
                  )}
                </div>
                <input type="text" className="input-field" placeholder="Item name (e.g. Lawn Suit, 3 Meters Fabric)"
                  value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label block mb-1.5">Qty</label>
                    <input type="number" className="input-field" min="1" value={item.qty || ''}
                      onChange={e => updateItem(item.id, 'qty', Number(e.target.value) || 1)} />
                  </div>
                  <div>
                    <label className="label block mb-1.5">Price (PKR)</label>
                    <input type="number" className="input-field" placeholder="5000" min="0" value={item.price || ''}
                      onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label block mb-1.5">After Discount</label>
                    <input type="number" className="input-field" placeholder="4500" min="0"
                      value={item.discounted_price || ''}
                      onChange={e => updateItem(item.id, 'discounted_price', Number(e.target.value))} />
                  </div>
                </div>
                {item.price > 0 && item.discounted_price > 0 && item.price !== item.discounted_price && (
                  <p className="text-[12px] text-[#34C759]">
                    Saving {formatPKR((item.price - item.discounted_price) * item.qty)} on this item
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <button onClick={addItem}
              className="w-full py-3 border border-dashed border-[#C7C7CC] rounded-xl text-[14px] text-[#6E6E73] hover:border-[#0066CC] hover:text-[#0066CC] hover:bg-blue-50/50 transition-all">
              + Add another item
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="card p-5 space-y-3">
          <div className="flex justify-between text-[14px]">
            <span className="text-[#6E6E73]">Original Total</span>
            <span className="text-[#1D1D1F]">{formatPKR(subtotal)}</span>
          </div>
          {saved > 0 && (
            <div className="flex justify-between text-[14px]">
              <span className="text-[#6E6E73]">Discount</span>
              <span className="text-[#34C759]">- {formatPKR(saved)}</span>
            </div>
          )}
          <div className="border-t border-[#E5E5E7] pt-3 flex justify-between">
            <span className="text-[16px] font-bold text-[#1D1D1F]">Total</span>
            <span className="text-[18px] font-bold text-[#1D1D1F]">{formatPKR(total)}</span>
          </div>
        </div>

        {/* Note */}
        <div className="card p-5">
          <label className="label block mb-2">Note (optional)</label>
          <textarea className="input-field !h-20 resize-none" placeholder="e.g. Exchange within 7 days with receipt."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving || items.every(i => !i.name)}
          className="btn-primary w-full py-4 text-[15px]">
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : 'Save & Export Bill'}
        </button>

        <div className="h-6" />
      </div>
    </div>
  )
}
