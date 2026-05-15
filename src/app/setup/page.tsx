'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SetupPage() {
  const router = useRouter()
  const [shopName, setShopName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (!shopName.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { error } = await supabase.from('shop_profiles').upsert({
      user_id: user.id,
      shop_name: shopName.trim(),
      address: address.trim(),
      phone: phone.trim(),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px] fade-up">

        <div className="text-center mb-10">
          <div className="text-[40px] mb-3">🏪</div>
          <h1 className="text-[26px] font-bold text-[#1D1D1F] tracking-tight">Set up your shop</h1>
          <p className="text-[15px] text-[#6E6E73] mt-1">This appears on every bill you create</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSetup} className="space-y-5">
            <div>
              <label className="label block mb-2">Shop Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Al-Noor Fabrics"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label block mb-2">Address</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Shop #12, Zainab Market, Karachi"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="label block mb-2">Phone</label>
              <input
                type="tel"
                className="input-field"
                placeholder="e.g. 0300-1234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-[13px] text-[#FF3B30] bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading || !shopName.trim()}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : 'Save & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
