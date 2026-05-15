'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Bill, ShopProfile } from '@/types'

function formatPKR(n: number) {
  return 'PKR ' + n.toLocaleString('en-PK')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const router = useRouter()
  const [shop, setShop] = useState<ShopProfile | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: shopData } = await supabase
        .from('shop_profiles').select('*').eq('user_id', user.id).single()

      if (!shopData) { router.push('/setup'); return }
      setShop(shopData)

      const { data: billsData } = await supabase
        .from('bills').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setBills(billsData || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const filtered = bills.filter(b =>
    b.bill_number.toLowerCase().includes(search.toLowerCase()) ||
    (b.customer_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0)
  const thisMonth = bills.filter(b => {
    const d = new Date(b.created_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthRevenue = thisMonth.reduce((s, b) => s + b.total, 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F7]">

      {/* Top Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E5E5E7] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0066CC] rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                <path d="M7 4h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" stroke="white" strokeWidth="1.8"/>
                <path d="M9 9h10M9 13h10M9 17h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#1D1D1F] leading-none">{shop?.shop_name}</p>
              <p className="text-[11px] text-[#6E6E73] leading-none mt-0.5">BillKar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/setup" className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors">
              Settings
            </Link>
            <button onClick={handleSignOut} className="text-[13px] text-[#6E6E73] hover:text-[#1D1D1F] px-3 py-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 fade-up">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Bills', value: bills.length.toString(), sub: 'all time' },
            { label: 'This Month', value: thisMonth.length.toString(), sub: 'bills' },
            { label: 'Month Revenue', value: formatPKR(monthRevenue), sub: formatPKR(totalRevenue) + ' total' },
          ].map((s, i) => (
            <div key={i} className="card px-4 py-4">
              <p className="label mb-2">{s.label}</p>
              <p className="text-[20px] font-bold text-[#1D1D1F] leading-none">{s.value}</p>
              <p className="text-[11px] text-[#AEAEB2] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* New bill button + search */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            className="input-field flex-1 !py-2.5 !text-[14px]"
            placeholder="Search by bill # or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Link href="/bills/new" className="btn-primary whitespace-nowrap flex items-center gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            New Bill
          </Link>
        </div>

        {/* Bills list */}
        <div className="card divide-y divide-[#F5F5F7]">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-[40px] mb-3">🧾</div>
              <p className="text-[16px] font-medium text-[#1D1D1F]">No bills yet</p>
              <p className="text-[14px] text-[#6E6E73] mt-1">Create your first bill to get started</p>
              <Link href="/bills/new" className="btn-primary inline-flex mt-5">
                Create first bill
              </Link>
            </div>
          ) : filtered.map(bill => (
            <Link
              key={bill.id}
              href={`/bills/${bill.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F5F7] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-[#F5F5F7] rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#6E6E73" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#1D1D1F]">#{bill.bill_number}</p>
                  <p className="text-[12px] text-[#6E6E73]">
                    {bill.customer_name || 'No customer'} · {formatDate(bill.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[15px] font-semibold text-[#1D1D1F]">{formatPKR(bill.total)}</p>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#AEAEB2" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
