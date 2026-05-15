'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/auth')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-[#0066CC] border-t-transparent animate-spin" />
    </div>
  )
}
