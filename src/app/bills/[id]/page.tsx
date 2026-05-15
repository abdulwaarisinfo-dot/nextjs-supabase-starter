'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Bill, ShopProfile } from '@/types'

function formatPKR(n: number) {
  return 'PKR ' + n.toLocaleString('en-PK')
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BillDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [bill, setBill] = useState<Bill | null>(null)
  const [shop, setShop] = useState<ShopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth'); return }
      Promise.all([
        supabase.from('bills').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('shop_profiles').select('*').eq('user_id', user.id).single()
      ]).then(([{ data: billData }, { data: shopData }]) => {
        if (!billData || !shopData) { router.push('/dashboard'); return }
        setBill(billData)
        setShop(shopData)
        setLoading(false)
      })
    })
  }, [id, router])

  async function handleExport() {
    if (!bill || !shop) return
    setExporting(true)
    const { exportBillPDF } = await import('@/lib/pdf')
    await exportBillPDF(bill, shop)
    setExporting(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this bill? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('bills').delete().eq('id', id)
    router.push('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
    </div>
  )

  if (!bill || !shop) return null

  const saved = bill.subtotal - bill.total

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
          <p className="text-[14px] font-semibold text-[#1D1D1F]">#{bill.bill_number}</p>
          <button onClick={handleExport} disabled={exporting}
            className="btn-primary !py-2 !px-4 !text-[14px] flex items-center gap-2">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </nav>

      {/* Bill preview — this is what gets printed */}
      <div className="max-w-2xl mx-auto px-4 py-6 fade-up">

        {/* Receipt card */}
        <div id="bill-preview" className="card overflow-hidden mb-4">

          {/* Shop header */}
          <div className="bg-[#1D1D1F] text-white px-8 py-8 text-center">
            <p className="text-[22px] font-bold tracking-wider">{shop.shop_name.toUpperCase()}</p>
            {shop.address && <p className="text-[13px] text-white/60 mt-1">{shop.address}</p>}
            {shop.phone && <p className="text-[13px] text-white/60">{shop.phone}</p>}
          </div>

          <div className="px-8 py-6 space-y-6">

            {/* Bill meta */}
            <div className="flex items-start justify-between">
              <div>
                <p className="label mb-1">Invoice</p>
                <p className="text-[22px] font-bold text-[#1D1D1F] font-mono">#{bill.bill_number}</p>
              </div>
              <div className="text-right">
                <p className="label mb-1">Date</p>
                <p className="text-[14px] text-[#1D1D1F]">{formatDate(bill.created_at)}</p>
              </div>
            </div>

            {/* Customer */}
            {bill.customer_name && (
              <div className="bg-[#F5F5F7] rounded-xl px-4 py-4">
                <p className="label mb-1">Bill To</p>
                <p className="text-[15px] font-semibold text-[#1D1D1F]">{bill.customer_name}</p>
                {bill.customer_phone && <p className="text-[13px] text-[#6E6E73]">{bill.customer_phone}</p>}
              </div>
            )}

            {/* Items */}
            <div>
              <div className="grid grid-cols-12 text-[11px] font-semibold text-[#AEAEB2] uppercase tracking-wider pb-2 border-b border-[#E5E5E7]">
                <span className="col-span-5">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-3 text-right">Amount</span>
              </div>
              <div className="divide-y divide-[#F5F5F7]">
                {bill.items.map((item) => {
                  const lineTotal = (item.discounted_price || item.price) * item.qty
                  const wasMore = item.price !== item.discounted_price && item.discounted_price > 0
                  return (
                    <div key={item.id} className="grid grid-cols-12 py-3 items-center">
                      <div className="col-span-5">
                        <p className="text-[14px] font-medium text-[#1D1D1F]">{item.name}</p>
                        {wasMore && (
                          <p className="text-[11px] text-[#AEAEB2]">
                            Was {formatPKR(item.price)}
                          </p>
                        )}
                      </div>
                      <p className="col-span-2 text-[14px] text-[#6E6E73] text-center">{item.qty}</p>
                      <p className="col-span-2 text-[14px] text-[#6E6E73] text-right">
                        {formatPKR(item.discounted_price || item.price)}
                      </p>
                      <p className="col-span-3 text-[14px] font-semibold text-[#1D1D1F] text-right">
                        {formatPKR(lineTotal)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-[#E5E5E7]">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#6E6E73]">Original Total</span>
                <span className="text-[#1D1D1F]">{formatPKR(bill.subtotal)}</span>
              </div>
              {saved > 0 && (
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#6E6E73]">Discount</span>
                  <span className="text-[#34C759] font-medium">− {formatPKR(saved)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-[#E5E5E7]">
                <span className="text-[17px] font-bold text-[#1D1D1F]">Total</span>
                <span className="text-[20px] font-bold text-[#1D1D1F]">{formatPKR(bill.total)}</span>
              </div>
              {saved > 0 && (
                <p className="text-[12px] text-[#34C759] text-center pt-1">
                  🎉 Customer saved {formatPKR(saved)} on this purchase
                </p>
              )}
            </div>

            {/* Note */}
            {bill.note && (
              <div className="bg-[#F5F5F7] rounded-xl px-4 py-3">
                <p className="text-[12px] text-[#6E6E73]">{bill.note}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-[#F5F5F7]">
              <p className="text-[11px] text-[#AEAEB2]">Thank you for your purchase · BillKar</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="btn-secondary !text-[#FF3B30] flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            {deleting ? '…' : 'Delete'}
          </button>
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
