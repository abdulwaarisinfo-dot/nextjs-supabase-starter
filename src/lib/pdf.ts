'use client'

import jsPDF from 'jspdf'
import type { Bill, ShopProfile } from '@/types'

function formatPKR(amount: number) {
  return 'PKR ' + amount.toLocaleString('en-PK', { minimumFractionDigits: 0 })
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function exportBillPDF(bill: Bill, shop: ShopProfile) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2
  let y = margin

  // ─── Fonts & helpers ───────────────────────────────────────────
  const setFont = (size: number, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }
  const text = (str: string, x: number, yPos: number, align: 'left' | 'center' | 'right' = 'left') => {
    doc.text(str, x, yPos, { align })
  }
  const line = (yPos: number, dashed = false) => {
    doc.setDrawColor(220, 220, 220)
    if (dashed) {
      doc.setLineDashPattern([1, 2], 0)
    } else {
      doc.setLineDashPattern([], 0)
    }
    doc.line(margin, yPos, margin + contentW, yPos)
    doc.setLineDashPattern([], 0)
  }

  // ─── Header: Shop name ─────────────────────────────────────────
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageW, 36, 'F')

  setFont(20, 'bold')
  doc.setTextColor(255, 255, 255)
  text(shop.shop_name.toUpperCase(), pageW / 2, 16, 'center')

  setFont(8, 'normal')
  doc.setTextColor(180, 180, 180)
  if (shop.address) text(shop.address, pageW / 2, 23, 'center')
  if (shop.phone) text(shop.phone, pageW / 2, 29, 'center')

  y = 48

  // ─── Bill meta ─────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  setFont(9, 'normal')
  text('INVOICE', margin, y)
  setFont(9, 'normal')
  doc.setTextColor(100, 100, 100)
  text(formatDate(bill.created_at), margin + contentW, y, 'right')

  y += 6
  setFont(18, 'bold')
  doc.setTextColor(10, 10, 10)
  text('#' + bill.bill_number, margin, y)

  y += 8
  line(y)
  y += 8

  // ─── Customer info ─────────────────────────────────────────────
  if (bill.customer_name) {
    setFont(8)
    doc.setTextColor(130, 130, 130)
    text('BILL TO', margin, y)
    y += 5
    setFont(11, 'bold')
    doc.setTextColor(10, 10, 10)
    text(bill.customer_name, margin, y)
    if (bill.customer_phone) {
      y += 5
      setFont(9)
      doc.setTextColor(100, 100, 100)
      text(bill.customer_phone, margin, y)
    }
    y += 10
    line(y)
    y += 8
  }

  // ─── Items table header ─────────────────────────────────────────
  const col = {
    item: margin,
    qty: margin + contentW * 0.52,
    price: margin + contentW * 0.68,
    total: margin + contentW,
  }

  setFont(8, 'bold')
  doc.setTextColor(130, 130, 130)
  text('ITEM', col.item, y)
  text('QTY', col.qty, y)
  text('UNIT PRICE', col.price, y)
  text('AMOUNT', col.total, y, 'right')

  y += 4
  line(y)
  y += 7

  // ─── Items ─────────────────────────────────────────────────────
  bill.items.forEach((item) => {
    const lineTotal = item.discounted_price * item.qty
    const wasPrice = item.price !== item.discounted_price

    setFont(10, 'normal')
    doc.setTextColor(15, 15, 15)

    // Wrap long item names
    const nameLines = doc.splitTextToSize(item.name, col.qty - col.item - 4)
    doc.text(nameLines, col.item, y)

    text(String(item.qty), col.qty, y)
    text(formatPKR(item.discounted_price), col.price, y)
    text(formatPKR(lineTotal), col.total, y, 'right')

    if (wasPrice) {
      y += 5
      setFont(7.5)
      doc.setTextColor(160, 160, 160)
      text(`Was ${formatPKR(item.price)} → saved ${formatPKR((item.price - item.discounted_price) * item.qty)}`, col.item, y)
    }

    y += nameLines.length > 1 ? nameLines.length * 5 + 3 : 8
  })

  // ─── Totals ─────────────────────────────────────────────────────
  line(y)
  y += 8

  const totalSaved = bill.subtotal - bill.total

  setFont(9)
  doc.setTextColor(100, 100, 100)
  text('Original Total', margin, y)
  text(formatPKR(bill.subtotal), margin + contentW, y, 'right')

  if (totalSaved > 0) {
    y += 6
    text('Discount', margin, y)
    doc.setTextColor(0, 130, 80)
    text('- ' + formatPKR(totalSaved), margin + contentW, y, 'right')
  }

  y += 8
  line(y)
  y += 8

  setFont(13, 'bold')
  doc.setTextColor(10, 10, 10)
  text('TOTAL', margin, y)
  text(formatPKR(bill.total), margin + contentW, y, 'right')

  if (totalSaved > 0) {
    y += 7
    setFont(8.5)
    doc.setTextColor(0, 130, 80)
    text(`You saved ${formatPKR(totalSaved)} on this purchase`, pageW / 2, y, 'center')
  }

  // ─── Note ───────────────────────────────────────────────────────
  if (bill.note) {
    y += 12
    line(y, true)
    y += 8
    setFont(8)
    doc.setTextColor(130, 130, 130)
    text('NOTE', margin, y)
    y += 5
    setFont(9)
    doc.setTextColor(60, 60, 60)
    const noteLines = doc.splitTextToSize(bill.note, contentW)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 5
  }

  // ─── Footer ─────────────────────────────────────────────────────
  const footerY = 280
  doc.setDrawColor(230, 230, 230)
  doc.line(margin, footerY, margin + contentW, footerY)
  setFont(7.5)
  doc.setTextColor(180, 180, 180)
  text('Generated by BillKar · billkar.vercel.app', pageW / 2, footerY + 5, 'center')

  doc.save(`Bill-${bill.bill_number}-${bill.customer_name || 'Customer'}.pdf`)
}
