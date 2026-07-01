"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Upload, X, Sparkles, ChevronRight, Trash2, Bot, FileText, Search, FolderOpen, FolderPlus, Check, MoreHorizontal } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AILoadingDots from "@/components/shared/AILoadingDots"

// ── Types ──────────────────────────────────────────────────────────────
type TVar = { key: string; label: string; placeholder?: string; multiline?: boolean; required?: boolean }
type Template = {
  id: string; name: string; nameEn: string; cat: string
  icon: string; color: string; desc: string; vars: TVar[]
}
type CustomTemplate = {
  id: string; name: string; category: string; folder: string
  variables: TVar[]; created_at: string
}

// ── Built-in template library (42 templates) ──────────────────────────
const TEMPLATES: Template[] = [
  // ─ Sales ─
  { id: "quotation", name: "ใบเสนอราคา", nameEn: "Quotation", cat: "company", icon: "📄", color: "#6366f1", desc: "เสนอราคาสินค้า/บริการพร้อม VAT",
    vars: [
      { key: "QuotationNo", label: "เลขที่", placeholder: "QT-2568-001", required: true },
      { key: "Date", label: "วันที่", placeholder: "1 กรกฎาคม 2568", required: true },
      { key: "ValidDays", label: "ใช้ได้ (วัน)", placeholder: "30" },
      { key: "CustomerName", label: "ชื่อลูกค้า/บริษัท", placeholder: "บริษัท ABC จำกัด", required: true },
      { key: "CustomerAddress", label: "ที่อยู่ลูกค้า", placeholder: "123 ถนน...", multiline: true },
      { key: "Products", label: "รายการสินค้า/บริการ", placeholder: "สินค้า A x1  ราคา 10,000 บาท\nบริการ B x2  ราคา 5,000 บาท", multiline: true, required: true },
      { key: "SubTotal", label: "ยอดก่อน VAT", placeholder: "15,000" },
      { key: "VAT", label: "VAT 7%", placeholder: "1,050" },
      { key: "Total", label: "ยอดรวม", placeholder: "16,050", required: true },
      { key: "PaymentTerms", label: "เงื่อนไขชำระ", placeholder: "ชำระภายใน 30 วัน" },
      { key: "Notes", label: "หมายเหตุ", placeholder: "ราคาไม่รวมค่าขนส่ง", multiline: true },
    ]},
  { id: "invoice", name: "ใบแจ้งหนี้", nameEn: "Invoice", cat: "company", icon: "🧾", color: "#6366f1", desc: "ใบวางบิลพร้อมรายละเอียดการชำระ",
    vars: [
      { key: "InvoiceNo", label: "เลขที่ใบแจ้งหนี้", placeholder: "INV-2568-001", required: true },
      { key: "Date", label: "วันที่ออก", placeholder: "1 กรกฎาคม 2568", required: true },
      { key: "DueDate", label: "วันครบกำหนด", placeholder: "31 กรกฎาคม 2568", required: true },
      { key: "CustomerName", label: "ชื่อลูกค้า", placeholder: "บริษัท XYZ", required: true },
      { key: "CustomerAddress", label: "ที่อยู่", multiline: true },
      { key: "Items", label: "รายการ", placeholder: "ค่าพัฒนาเว็บไซต์ 1 รายการ 50,000 บาท", multiline: true, required: true },
      { key: "Total", label: "ยอดรวม", placeholder: "53,500", required: true },
      { key: "BankAccount", label: "บัญชีธนาคาร", placeholder: "ธ.กสิกรไทย เลขที่ xxx-x-xxxxx-x" },
    ]},
  { id: "receipt", name: "ใบเสร็จรับเงิน", nameEn: "Receipt", cat: "company", icon: "🧾", color: "#6366f1", desc: "ใบเสร็จอย่างเป็นทางการ",
    vars: [
      { key: "ReceiptNo", label: "เลขที่ใบเสร็จ", placeholder: "RC-2568-001", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "CustomerName", label: "ได้รับเงินจาก", required: true },
      { key: "Items", label: "รายการ", multiline: true, required: true },
      { key: "Amount", label: "จำนวนเงิน (ตัวเลข)", placeholder: "10,000", required: true },
      { key: "AmountText", label: "จำนวนเงิน (ตัวอักษร)", placeholder: "หนึ่งหมื่นบาทถ้วน", required: true },
      { key: "PaymentMethod", label: "ชำระโดย", placeholder: "โอนเงิน / เงินสด" },
    ]},
  { id: "purchase-order", name: "ใบสั่งซื้อ", nameEn: "Purchase Order", cat: "company", icon: "🛒", color: "#6366f1", desc: "สั่งซื้อสินค้าจากผู้จำหน่าย",
    vars: [
      { key: "PONumber", label: "เลขที่ PO", placeholder: "PO-2568-001", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "SupplierName", label: "ผู้จำหน่าย", required: true },
      { key: "DeliveryDate", label: "กำหนดส่ง", required: true },
      { key: "DeliveryAddress", label: "ที่อยู่จัดส่ง", multiline: true },
      { key: "Items", label: "รายการสั่งซื้อ", multiline: true, required: true, placeholder: "สินค้า A  จำนวน 10 ชิ้น  ราคา 500 บาท/ชิ้น" },
      { key: "Total", label: "ยอดรวม", required: true },
      { key: "PaymentTerms", label: "เงื่อนไขชำระ", placeholder: "Net 30" },
    ]},
  { id: "sales-report", name: "รายงานการขาย", nameEn: "Sales Report", cat: "company", icon: "📊", color: "#6366f1", desc: "สรุปยอดขายประจำเดือน/ไตรมาส",
    vars: [
      { key: "Period", label: "ช่วงเวลา", placeholder: "เดือนมิถุนายน 2568", required: true },
      { key: "TotalSales", label: "ยอดขายรวม", required: true, placeholder: "1,250,000 บาท" },
      { key: "TopProducts", label: "สินค้าขายดี 3 อันดับ", multiline: true },
      { key: "TopCustomers", label: "ลูกค้ารายใหญ่", multiline: true },
      { key: "Analysis", label: "วิเคราะห์ผล", multiline: true, required: true },
      { key: "NextMonthTarget", label: "เป้าหมายเดือนถัดไป", placeholder: "1,500,000 บาท" },
    ]},
  { id: "customer-visit", name: "รายงานเยี่ยมลูกค้า", nameEn: "Customer Visit Report", cat: "company", icon: "🤝", color: "#6366f1", desc: "บันทึกการพบปะและติดตามลูกค้า",
    vars: [
      { key: "Date", label: "วันที่", required: true },
      { key: "CustomerName", label: "ลูกค้า/บริษัท", required: true },
      { key: "ContactName", label: "ผู้ติดต่อ", required: true },
      { key: "Purpose", label: "วัตถุประสงค์", required: true },
      { key: "Discussion", label: "สิ่งที่พูดคุย", multiline: true, required: true },
      { key: "Outcome", label: "ผลลัพธ์", multiline: true, required: true },
      { key: "NextAction", label: "ขั้นตอนถัดไป", multiline: true },
    ]},
  // ─ HR ─
  { id: "employment-contract", name: "สัญญาจ้างงาน", nameEn: "Employment Contract", cat: "hr", icon: "📋", color: "#10b981", desc: "สัญญาระหว่างนายจ้างและลูกจ้าง",
    vars: [
      { key: "EmployeeName", label: "ชื่อลูกจ้าง", required: true },
      { key: "Position", label: "ตำแหน่ง", required: true },
      { key: "Department", label: "แผนก", required: true },
      { key: "StartDate", label: "วันเริ่มงาน", required: true },
      { key: "Salary", label: "เงินเดือน (บาท)", required: true, placeholder: "25,000" },
      { key: "WorkHours", label: "เวลาทำงาน", placeholder: "08:30-17:30 จันทร์-ศุกร์" },
      { key: "Probation", label: "ทดลองงาน", placeholder: "3 เดือน" },
      { key: "Benefits", label: "สวัสดิการ", multiline: true, placeholder: "ประกันสังคม, ประกันสุขภาพ, วันลาพักร้อน 10 วัน" },
    ]},
  { id: "employment-cert", name: "หนังสือรับรองทำงาน", nameEn: "Employment Certificate", cat: "hr", icon: "🏆", color: "#10b981", desc: "รับรองสถานภาพพนักงาน",
    vars: [
      { key: "EmployeeName", label: "ชื่อพนักงาน", required: true },
      { key: "Position", label: "ตำแหน่ง", required: true },
      { key: "Department", label: "แผนก" },
      { key: "StartDate", label: "วันเริ่มงาน", required: true },
      { key: "EndDate", label: "วันสิ้นสุด", placeholder: "ปัจจุบัน" },
      { key: "Salary", label: "เงินเดือน (ถ้าระบุ)", placeholder: "ไม่ระบุ" },
      { key: "Purpose", label: "วัตถุประสงค์", placeholder: "เพื่อใช้ในการยื่นกู้สินเชื่อ", required: true },
    ]},
  { id: "leave-request", name: "ใบลาหยุดงาน", nameEn: "Leave Request", cat: "hr", icon: "📅", color: "#10b981", desc: "แบบฟอร์มขออนุมัติลา",
    vars: [
      { key: "EmployeeName", label: "ชื่อผู้ขอลา", required: true },
      { key: "Position", label: "ตำแหน่ง" },
      { key: "Department", label: "แผนก" },
      { key: "LeaveType", label: "ประเภทการลา", placeholder: "ลาพักร้อน / ลาป่วย / ลากิจ", required: true },
      { key: "StartDate", label: "ตั้งแต่วันที่", required: true },
      { key: "EndDate", label: "ถึงวันที่", required: true },
      { key: "TotalDays", label: "รวม (วัน)", required: true },
      { key: "Reason", label: "เหตุผล", multiline: true, required: true },
      { key: "Contact", label: "ช่องทางติดต่อระหว่างลา" },
    ]},
  { id: "job-offer", name: "หนังสือเสนองาน", nameEn: "Job Offer Letter", cat: "hr", icon: "🎯", color: "#10b981", desc: "เสนอตำแหน่งพร้อมเงื่อนไข",
    vars: [
      { key: "CandidateName", label: "ชื่อผู้สมัคร", required: true },
      { key: "Position", label: "ตำแหน่ง", required: true },
      { key: "Department", label: "แผนก" },
      { key: "StartDate", label: "วันเริ่มงาน", required: true },
      { key: "Salary", label: "เงินเดือน", required: true },
      { key: "Benefits", label: "สวัสดิการ", multiline: true },
      { key: "AcceptDeadline", label: "กรุณาตอบรับภายใน", required: true, placeholder: "15 กรกฎาคม 2568" },
    ]},
  { id: "warning-letter", name: "หนังสือเตือน", nameEn: "Warning Letter", cat: "hr", icon: "⚠️", color: "#10b981", desc: "แจ้งเตือนการกระทำผิดระเบียบ",
    vars: [
      { key: "EmployeeName", label: "ชื่อพนักงาน", required: true },
      { key: "Position", label: "ตำแหน่ง" },
      { key: "Date", label: "วันที่เกิดเหตุ", required: true },
      { key: "Incident", label: "เหตุการณ์/ความผิด", multiline: true, required: true },
      { key: "Warning", label: "คำเตือนและผลที่ตามมา", multiline: true, required: true },
    ]},
  { id: "resignation", name: "ใบลาออก", nameEn: "Resignation Letter", cat: "hr", icon: "📨", color: "#10b981", desc: "หนังสือแจ้งลาออก",
    vars: [
      { key: "EmployeeName", label: "ชื่อผู้ลาออก", required: true },
      { key: "Position", label: "ตำแหน่ง", required: true },
      { key: "Department", label: "แผนก" },
      { key: "LastDay", label: "วันสุดท้ายที่ทำงาน", required: true },
      { key: "Reason", label: "สาเหตุ (ถ้าระบุ)", multiline: true },
      { key: "Handover", label: "แผนส่งมอบงาน", multiline: true },
    ]},
  { id: "training-plan", name: "แผนฝึกอบรม", nameEn: "Training Plan", cat: "hr", icon: "📚", color: "#10b981", desc: "แผนการฝึกอบรมพนักงาน",
    vars: [
      { key: "TrainingName", label: "หลักสูตร", required: true },
      { key: "Trainer", label: "วิทยากร", required: true },
      { key: "Trainees", label: "ผู้เข้าอบรม", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Duration", label: "ระยะเวลา", required: true, placeholder: "1 วัน (08:30-16:30 น.)" },
      { key: "Venue", label: "สถานที่" },
      { key: "Content", label: "หัวข้อเนื้อหา", multiline: true, required: true },
      { key: "Budget", label: "งบประมาณ" },
    ]},
  // ─ Finance ─
  { id: "expense-report", name: "รายงานค่าใช้จ่าย", nameEn: "Expense Report", cat: "accounting", icon: "💰", color: "#f59e0b", desc: "รายงานค่าใช้จ่ายเพื่อเบิกคืน",
    vars: [
      { key: "EmployeeName", label: "ชื่อพนักงาน", required: true },
      { key: "Period", label: "ช่วงเวลา", required: true },
      { key: "Purpose", label: "วัตถุประสงค์", required: true },
      { key: "Expenses", label: "รายการค่าใช้จ่าย", multiline: true, required: true, placeholder: "ค่าเดินทาง 500 บาท\nค่าอาหาร 300 บาท\nค่าที่พัก 1,200 บาท" },
      { key: "Total", label: "รวมทั้งสิ้น", required: true },
    ]},
  { id: "budget-proposal", name: "แผนงบประมาณ", nameEn: "Budget Proposal", cat: "accounting", icon: "📈", color: "#f59e0b", desc: "แผนงบประมาณประจำปี/ไตรมาส",
    vars: [
      { key: "Department", label: "ฝ่าย/แผนก", required: true },
      { key: "Period", label: "ช่วงงบประมาณ", required: true, placeholder: "ปีงบประมาณ 2569" },
      { key: "Objectives", label: "วัตถุประสงค์", multiline: true, required: true },
      { key: "BudgetItems", label: "รายการงบประมาณ", multiline: true, required: true, placeholder: "ค่าวัสดุ 50,000\nค่าบุคลากร 300,000\nค่าดำเนินงาน 150,000" },
      { key: "TotalBudget", label: "งบประมาณรวม", required: true },
      { key: "Justification", label: "เหตุผลและความจำเป็น", multiline: true },
    ]},
  { id: "payment-voucher", name: "ใบสำคัญจ่าย", nameEn: "Payment Voucher", cat: "accounting", icon: "💸", color: "#f59e0b", desc: "เอกสารอนุมัติจ่ายเงิน",
    vars: [
      { key: "VoucherNo", label: "เลขที่ใบสำคัญ", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Payee", label: "จ่ายให้", required: true },
      { key: "Description", label: "รายการ", multiline: true, required: true },
      { key: "Amount", label: "จำนวนเงิน", required: true },
      { key: "Account", label: "บัญชีที่ตัด" },
    ]},
  { id: "financial-summary", name: "สรุปผลทางการเงิน", nameEn: "Financial Summary", cat: "accounting", icon: "📊", color: "#f59e0b", desc: "สรุปผลประกอบการประจำเดือน",
    vars: [
      { key: "Period", label: "ช่วงเวลา", required: true, placeholder: "เดือนมิถุนายน 2568" },
      { key: "Revenue", label: "รายรับรวม", required: true },
      { key: "Expenses", label: "รายจ่ายรวม", required: true },
      { key: "NetProfit", label: "กำไรสุทธิ", required: true },
      { key: "Analysis", label: "วิเคราะห์ผล", multiline: true, required: true },
      { key: "Recommendations", label: "ข้อเสนอแนะ", multiline: true },
    ]},
  { id: "cash-flow", name: "กระแสเงินสด", nameEn: "Cash Flow Statement", cat: "accounting", icon: "💹", color: "#f59e0b", desc: "รายงานกระแสเงินสดเข้า-ออก",
    vars: [
      { key: "Period", label: "ช่วงเวลา", required: true },
      { key: "OpeningBalance", label: "ยอดยกมาต้นงวด", required: true },
      { key: "CashInflows", label: "เงินสดรับ (รายการ)", multiline: true, required: true },
      { key: "TotalInflow", label: "รวมเงินสดรับ", required: true },
      { key: "CashOutflows", label: "เงินสดจ่าย (รายการ)", multiline: true, required: true },
      { key: "TotalOutflow", label: "รวมเงินสดจ่าย", required: true },
      { key: "ClosingBalance", label: "ยอดยกไปสิ้นงวด", required: true },
    ]},
  // ─ Government ─
  { id: "internal-memo", name: "บันทึกข้อความ", nameEn: "Internal Memo", cat: "government", icon: "📝", color: "#8b5cf6", desc: "หนังสือภายในหน่วยงาน",
    vars: [
      { key: "DocNo", label: "ที่", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "To", label: "เรียน", required: true },
      { key: "From", label: "จาก", required: true },
      { key: "Subject", label: "เรื่อง", required: true },
      { key: "Content", label: "เนื้อหา", multiline: true, required: true },
      { key: "Attachments", label: "สิ่งที่แนบมาด้วย" },
    ]},
  { id: "external-letter", name: "หนังสือภายนอก", nameEn: "External Letter", cat: "government", icon: "📬", color: "#8b5cf6", desc: "หนังสือราชการถึงหน่วยงานภายนอก",
    vars: [
      { key: "DocNo", label: "ที่", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "To", label: "เรียน", required: true },
      { key: "Subject", label: "เรื่อง", required: true },
      { key: "Reference", label: "อ้างถึง" },
      { key: "Content", label: "เนื้อหา", multiline: true, required: true },
    ]},
  { id: "announcement", name: "ประกาศ", nameEn: "Announcement", cat: "government", icon: "📢", color: "#8b5cf6", desc: "ประกาศหน่วยงาน/บริษัท",
    vars: [
      { key: "AnnouncementNo", label: "ที่", required: true },
      { key: "Subject", label: "เรื่อง", required: true },
      { key: "Date", label: "วันที่ประกาศ", required: true },
      { key: "Content", label: "ข้อความประกาศ", multiline: true, required: true },
    ]},
  { id: "meeting-minutes", name: "รายงานการประชุม", nameEn: "Meeting Minutes", cat: "government", icon: "🎤", color: "#8b5cf6", desc: "บันทึกการประชุมอย่างเป็นทางการ",
    vars: [
      { key: "MeetingNo", label: "ครั้งที่", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Time", label: "เวลา", placeholder: "09:00-12:00 น." },
      { key: "Venue", label: "สถานที่" },
      { key: "Attendees", label: "ผู้เข้าร่วมประชุม", multiline: true, required: true },
      { key: "Agenda", label: "ระเบียบวาระ", multiline: true, required: true },
      { key: "Resolutions", label: "มติที่ประชุม", multiline: true, required: true },
      { key: "NextMeeting", label: "การประชุมครั้งต่อไป" },
    ]},
  { id: "order-directive", name: "คำสั่ง", nameEn: "Order/Directive", cat: "government", icon: "📋", color: "#8b5cf6", desc: "คำสั่งแต่งตั้ง/มอบหมายงาน",
    vars: [
      { key: "OrderNo", label: "คำสั่งที่", required: true },
      { key: "Subject", label: "เรื่อง", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Content", label: "รายละเอียด", multiline: true, required: true },
      { key: "EffectiveDate", label: "มีผลตั้งแต่", required: true },
    ]},
  { id: "meeting-agenda", name: "ระเบียบวาระประชุม", nameEn: "Meeting Agenda", cat: "government", icon: "📌", color: "#8b5cf6", desc: "กำหนดการประชุม",
    vars: [
      { key: "MeetingName", label: "การประชุม", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Time", label: "เวลา", required: true },
      { key: "Venue", label: "สถานที่", required: true },
      { key: "AgendaItems", label: "วาระการประชุม", multiline: true, required: true, placeholder: "1. เรื่องแจ้งเพื่อทราบ\n2. เรื่องเพื่อพิจารณา\n3. เรื่องอื่นๆ" },
    ]},
  // ─ Legal ─
  { id: "nda", name: "สัญญาห้ามเปิดเผย (NDA)", nameEn: "NDA", cat: "legal", icon: "🔒", color: "#ef4444", desc: "Non-Disclosure Agreement",
    vars: [
      { key: "Party1", label: "ฝ่ายที่ 1", required: true },
      { key: "Party2", label: "ฝ่ายที่ 2", required: true },
      { key: "Purpose", label: "วัตถุประสงค์", multiline: true, required: true, placeholder: "เพื่อพิจารณาร่วมมือทางธุรกิจ" },
      { key: "Duration", label: "ระยะเวลา", placeholder: "2 ปี", required: true },
      { key: "Date", label: "วันที่ทำสัญญา", required: true },
    ]},
  { id: "service-agreement", name: "สัญญาให้บริการ", nameEn: "Service Agreement", cat: "legal", icon: "🤝", color: "#ef4444", desc: "สัญญาจ้างทำงาน/ให้บริการ",
    vars: [
      { key: "ServiceProvider", label: "ผู้ให้บริการ", required: true },
      { key: "Client", label: "ผู้รับบริการ", required: true },
      { key: "Services", label: "รายการบริการ", multiline: true, required: true },
      { key: "StartDate", label: "วันเริ่มสัญญา", required: true },
      { key: "EndDate", label: "วันสิ้นสุดสัญญา", required: true },
      { key: "Fee", label: "ค่าบริการ", required: true },
      { key: "PaymentSchedule", label: "กำหนดชำระ", multiline: true },
    ]},
  { id: "lease", name: "สัญญาเช่า", nameEn: "Lease Agreement", cat: "legal", icon: "🏠", color: "#ef4444", desc: "สัญญาเช่าที่ดิน/อาคาร/ทรัพย์สิน",
    vars: [
      { key: "Lessor", label: "ผู้ให้เช่า", required: true },
      { key: "Lessee", label: "ผู้เช่า", required: true },
      { key: "Property", label: "ทรัพย์สินที่เช่า", multiline: true, required: true },
      { key: "StartDate", label: "วันเริ่มเช่า", required: true },
      { key: "EndDate", label: "วันสิ้นสุด", required: true },
      { key: "Rent", label: "ค่าเช่า (บาท/เดือน)", required: true },
      { key: "Deposit", label: "เงินประกัน", required: true },
      { key: "Terms", label: "เงื่อนไขพิเศษ", multiline: true },
    ]},
  { id: "consignment", name: "สัญญาฝากขาย", nameEn: "Consignment Agreement", cat: "legal", icon: "📦", color: "#ef4444", desc: "ตกลงฝากสินค้าไว้ขาย",
    vars: [
      { key: "Consignor", label: "ผู้ฝากขาย", required: true },
      { key: "Consignee", label: "ผู้รับฝากขาย", required: true },
      { key: "Products", label: "สินค้าที่ฝากขาย", multiline: true, required: true },
      { key: "Commission", label: "ค่าคอมมิชชัน (%)", required: true, placeholder: "15%" },
      { key: "Period", label: "ระยะเวลา", required: true },
    ]},
  { id: "mou", name: "บันทึกความเข้าใจ (MOU)", nameEn: "MOU", cat: "legal", icon: "📜", color: "#ef4444", desc: "ความร่วมมือระหว่างองค์กร",
    vars: [
      { key: "Party1", label: "หน่วยงานที่ 1", required: true },
      { key: "Party2", label: "หน่วยงานที่ 2", required: true },
      { key: "Purpose", label: "วัตถุประสงค์", multiline: true, required: true },
      { key: "Scope", label: "ขอบเขตความร่วมมือ", multiline: true, required: true },
      { key: "Duration", label: "ระยะเวลา", required: true },
      { key: "Date", label: "วันที่ลงนาม", required: true },
    ]},
  // ─ General ─
  { id: "project-proposal", name: "ข้อเสนอโครงการ", nameEn: "Project Proposal", cat: "company", icon: "🚀", color: "#06b6d4", desc: "เสนอโครงการพร้อมแผนและงบ",
    vars: [
      { key: "ProjectName", label: "ชื่อโครงการ", required: true },
      { key: "Background", label: "ความเป็นมา/ปัญหา", multiline: true, required: true },
      { key: "Objectives", label: "วัตถุประสงค์", multiline: true, required: true },
      { key: "Activities", label: "แผนงาน/กิจกรรม", multiline: true, required: true },
      { key: "Timeline", label: "ระยะเวลา", required: true },
      { key: "Budget", label: "งบประมาณ", required: true },
      { key: "KPI", label: "ตัวชี้วัด (KPI)", multiline: true },
    ]},
  { id: "status-report", name: "รายงานความคืบหน้า", nameEn: "Status Report", cat: "company", icon: "📊", color: "#06b6d4", desc: "รายงานความก้าวหน้าโครงการ",
    vars: [
      { key: "ProjectName", label: "โครงการ", required: true },
      { key: "Period", label: "ช่วงรายงาน", required: true },
      { key: "Progress", label: "ความคืบหน้า (%)", placeholder: "65%" },
      { key: "Completed", label: "งานที่เสร็จแล้ว", multiline: true, required: true },
      { key: "InProgress", label: "งานที่กำลังทำ", multiline: true },
      { key: "Issues", label: "ปัญหา/อุปสรรค", multiline: true },
      { key: "NextActions", label: "แผนงานถัดไป", multiline: true },
    ]},
  { id: "business-plan", name: "แผนธุรกิจ", nameEn: "Business Plan", cat: "company", icon: "💼", color: "#06b6d4", desc: "แผนธุรกิจครบถ้วน",
    vars: [
      { key: "BusinessName", label: "ชื่อธุรกิจ", required: true },
      { key: "BusinessType", label: "ประเภทธุรกิจ", required: true },
      { key: "Problem", label: "ปัญหาที่แก้ไข", multiline: true, required: true },
      { key: "Solution", label: "วิธีแก้ปัญหา", multiline: true, required: true },
      { key: "TargetMarket", label: "กลุ่มเป้าหมาย", multiline: true, required: true },
      { key: "Revenue", label: "รูปแบบรายได้", multiline: true },
      { key: "Investment", label: "เงินลงทุนที่ต้องการ", placeholder: "500,000 บาท" },
      { key: "Timeline", label: "แผน 12 เดือน", multiline: true },
    ]},
  { id: "press-release", name: "ข่าวประชาสัมพันธ์", nameEn: "Press Release", cat: "marketing", icon: "📰", color: "#06b6d4", desc: "เอกสารประชาสัมพันธ์สำหรับสื่อ",
    vars: [
      { key: "Headline", label: "หัวข้อข่าว", required: true },
      { key: "Date", label: "วันที่", required: true },
      { key: "Lead", label: "ย่อหน้าแรก", multiline: true, required: true },
      { key: "Body", label: "เนื้อหา", multiline: true, required: true },
      { key: "Quote", label: "คำพูด (Quote)", multiline: true },
      { key: "About", label: "เกี่ยวกับบริษัท", multiline: true },
      { key: "Contact", label: "ผู้ติดต่อ", required: true },
    ]},
  { id: "risk-report", name: "รายงานความเสี่ยง", nameEn: "Risk Assessment", cat: "company", icon: "⚠️", color: "#06b6d4", desc: "ประเมินและจัดการความเสี่ยง",
    vars: [
      { key: "ProjectName", label: "โครงการ/หัวข้อ", required: true },
      { key: "Date", label: "วันที่ประเมิน", required: true },
      { key: "Risks", label: "รายการความเสี่ยง", multiline: true, required: true, placeholder: "ความเสี่ยง 1: ... ระดับ: สูง\nความเสี่ยง 2: ... ระดับ: กลาง" },
      { key: "Mitigation", label: "แผนจัดการความเสี่ยง", multiline: true, required: true },
      { key: "Conclusion", label: "สรุป", multiline: true },
    ]},
  { id: "recommendation", name: "หนังสือแนะนำตัว", nameEn: "Recommendation Letter", cat: "company", icon: "⭐", color: "#06b6d4", desc: "รับรองและแนะนำบุคคล",
    vars: [
      { key: "SubjectName", label: "ชื่อผู้ถูกแนะนำ", required: true },
      { key: "Relationship", label: "ความสัมพันธ์", required: true, placeholder: "เคยเป็นพนักงานของเรา" },
      { key: "Period", label: "ช่วงเวลา", required: true, placeholder: "มกราคม 2566 – มิถุนายน 2568" },
      { key: "Strengths", label: "จุดเด่น/ความสามารถ", multiline: true, required: true },
      { key: "Recommendation", label: "ข้อเสนอแนะ", multiline: true, required: true },
    ]},
  { id: "handover", name: "บันทึกส่งมอบงาน", nameEn: "Work Handover", cat: "company", icon: "🔄", color: "#06b6d4", desc: "ส่งมอบงานระหว่างผู้รับผิดชอบ",
    vars: [
      { key: "FromPerson", label: "ผู้ส่งมอบ", required: true },
      { key: "ToPerson", label: "ผู้รับมอบ", required: true },
      { key: "Date", label: "วันที่ส่งมอบ", required: true },
      { key: "Projects", label: "โครงการ/งานที่รับผิดชอบ", multiline: true, required: true },
      { key: "PendingTasks", label: "งานที่ยังค้างอยู่", multiline: true, required: true },
      { key: "ImportantContacts", label: "รายชื่อผู้ติดต่อสำคัญ", multiline: true },
      { key: "Notes", label: "หมายเหตุพิเศษ", multiline: true },
    ]},
]

const CATS = [
  { id: "all",         label: "ทั้งหมด",   emoji: "🗂",  comingSoon: false },
  { id: "recommended", label: "แนะนำ",     emoji: "⭐",  comingSoon: false },
  { id: "company",     label: "บริษัท",    emoji: "🏢",  comingSoon: false },
  { id: "accounting",  label: "บัญชี",     emoji: "💰",  comingSoon: false },
  { id: "hr",          label: "บุคคล",     emoji: "👨‍💼",  comingSoon: false },
  { id: "government",  label: "ราชการ",    emoji: "🏛",  comingSoon: false },
  { id: "legal",       label: "กฎหมาย",   emoji: "⚖️",  comingSoon: false },
  { id: "marketing",   label: "การตลาด",  emoji: "📈",  comingSoon: false },
]

const RECOMMENDED_IDS = ["quotation", "invoice", "internal-memo", "employment-contract", "meeting-minutes", "business-plan", "nda", "expense-report"]

// ── My Templates Folder Colors ──────────────────────────────────────────
const FOLDER_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"]
function folderColor(name: string) { return FOLDER_COLORS[Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % FOLDER_COLORS.length] }

// ── Component ─────────────────────────────────────────────────────────
function TemplatesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const section = searchParams.get("section") // "my" | null
  const [tab, setTab] = useState<"builtin" | "my">(section === "my" ? "my" : "builtin")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Template | null>(null)
  const [selectedCustom, setSelectedCustom] = useState<CustomTemplate | null>(null)
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState("")
  const [newFolderMode, setNewFolderMode] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadCustomTemplates() }, [])
  useEffect(() => { if (section === "my") setTab("my") }, [section])

  // Auto-open template from ?open= param
  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId) {
      const t = TEMPLATES.find(t => t.id === openId)
      if (t) { setSelected(t); setSelectedCustom(null); setVarValues({}) }
    }
  }, [searchParams])

  async function loadCustomTemplates() {
    try {
      const res = await fetch("/api/templates")
      if (res.ok) {
        const data = await res.json()
        setCustomTemplates(data.map((t: CustomTemplate) => ({ ...t, folder: t.folder ?? "ทั่วไป" })))
      }
    } catch { /* not critical */ }
  }

  async function handleFile(file: File) {
    const okExt = /\.(pdf|docx|doc)$/i.test(file.name)
    if (!okExt) { alert("รองรับเฉพาะไฟล์ PDF และ DOCX เท่านั้น"); return }
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/ai/templates/analyze", { method: "POST", body: fd })
      if (!res.ok) throw new Error()
      const { name, category, variables, folder } = await res.json()
      await fetch("/api/templates", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, variables, folder: folder ?? "ทั่วไป" }),
      })
      await loadCustomTemplates()
      setTab("my")
      setActiveFolder(null)
    } catch {
      alert("ไม่สามารถวิเคราะห์ไฟล์ได้ กรุณาลองใหม่")
    } finally { setAnalyzing(false) }
  }

  function openTemplate(t: Template) { setSelected(t); setSelectedCustom(null); setVarValues({}) }
  function openCustomTemplate(t: CustomTemplate) { setSelectedCustom(t); setSelected(null); setVarValues({}) }

  async function generate() {
    const name = selected?.name ?? selectedCustom?.name ?? ""
    const vars = selected?.vars ?? selectedCustom?.variables ?? []
    const missing = vars.filter(v => v.required && !varValues[v.key]?.trim())
    if (missing.length) { alert(`กรุณากรอก: ${missing.map(m => m.label).join(", ")}`); return }

    setGenerating(true)
    try {
      const res = await fetch("/api/ai/templates/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: selected?.id ?? "custom", templateName: name, variables: varValues }),
      })
      const { content, title } = await res.json()
      if (!content) throw new Error()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: doc } = await supabase.from("documents").insert({
        user_id: user.id, title: title || name, content,
        doc_type: selected?.id ?? "general",
        word_count: content.split(/\s+/).length,
      }).select().single()

      if (doc) router.push(`/documents/${doc.id}`)
    } catch { alert("ไม่สามารถสร้างเอกสารได้ กรุณาลองใหม่") }
    finally { setGenerating(false) }
  }

  async function deleteCustom(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("ลบ Template นี้?")) return
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" })
    setCustomTemplates(prev => prev.filter(t => t.id !== id))
  }

  async function moveToFolder(id: string, folder: string) {
    await fetch("/api/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, folder }),
    })
    setCustomTemplates(prev => prev.map(t => t.id === id ? { ...t, folder } : t))
    setMovingId(null)
    setMoveTarget("")
  }

  // Derived: folders from custom templates
  const allFolders = Array.from(new Set(customTemplates.map(t => t.folder ?? "ทั่วไป"))).sort()
  const templatesInFolder = activeFolder
    ? customTemplates.filter(t => (t.folder ?? "ทั่วไป") === activeFolder)
    : customTemplates

  const activeCat = CATS.find(c => c.id === filter)
  const isComingSoon = false
  const filtered = TEMPLATES.filter(t => {
    if (filter === "recommended") return RECOMMENDED_IDS.includes(t.id)
    if (filter !== "all" && t.cat !== filter) return false
    if (search && !t.name.includes(search) && !t.nameEn.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const activeVars = selected?.vars ?? selectedCustom?.variables ?? []
  const modalOpen = !!selected || !!selectedCustom

  const inputSt: React.CSSProperties = {
    width: "100%", background: "var(--bg-input)", border: "1px solid var(--bg-border)",
    borderRadius: 8, padding: "8px 10px", color: "var(--tx-primary)", fontSize: 13,
    outline: "none", boxSizing: "border-box",
  }

  return (
    <div>
      {/* ── Tab Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--bg-border)" }}>
        {[
          { id: "builtin", label: `📚 Template Library (${TEMPLATES.length})` },
          { id: "my",      label: `🧩 My Templates${customTemplates.length > 0 ? ` (${customTemplates.length})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as "builtin" | "my")}
            style={{
              padding: "10px 20px", background: "none", border: "none",
              borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
              color: tab === t.id ? "#a5b4fc" : "var(--tx-muted)",
              fontWeight: tab === t.id ? 700 : 500, fontSize: 14, cursor: "pointer",
              transition: "all .15s", marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MY TEMPLATES TAB
      ══════════════════════════════════════════════════════════════ */}
      {tab === "my" && (
        <div>
          {/* Hero upload */}
          <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Bot size={18} color="#818cf8" />
                  <span style={{ fontWeight: 800, color: "var(--tx-primary)", fontSize: 15 }}>AI Document Intelligence™</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#818cf8", background: "rgba(99,102,241,0.15)", padding: "2px 8px", borderRadius: 20 }}>⭐ Killer Feature</span>
                </div>
                <p style={{ color: "var(--tx-dim)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  อัปโหลด DOCX / PDF — AI วิเคราะห์โครงสร้าง ตรวจจับตัวแปร และสร้าง Template พร้อมจัด Folder อัตโนมัติ
                </p>
              </div>
              {/* Upload zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  minWidth: 200, border: `2px dashed ${dragOver ? "#818cf8" : "rgba(99,102,241,0.3)"}`,
                  borderRadius: 12, padding: "16px 20px", textAlign: "center", cursor: "pointer",
                  background: dragOver ? "rgba(99,102,241,0.08)" : "transparent", transition: "all .15s",
                }}>
                {analyzing ? <AILoadingDots label="AI กำลังวิเคราะห์…" /> : (
                  <>
                    <Upload size={22} color="#818cf8" style={{ marginBottom: 6 }} />
                    <div style={{ fontWeight: 600, color: "var(--tx-primary)", fontSize: 13, marginBottom: 2 }}>วางไฟล์หรือคลิกอัปโหลด</div>
                    <div style={{ fontSize: 11, color: "var(--tx-faint)" }}>PDF · DOCX</div>
                  </>
                )}
              </div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = "" } }} />

          {/* No templates yet */}
          {customTemplates.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed rgba(99,102,241,0.2)", borderRadius: 16 }}>
              <FolderOpen size={44} color="var(--tx-faint)" style={{ marginBottom: 14 }} />
              <div style={{ fontWeight: 700, color: "var(--tx-muted)", fontSize: 16, marginBottom: 8 }}>ยังไม่มี Template ของคุณ</div>
              <div style={{ color: "var(--tx-faint)", fontSize: 13, marginBottom: 20 }}>
                อัปโหลดเอกสารที่ใช้งานอยู่ แล้ว AI จะสร้าง Template และจัด Folder ให้อัตโนมัติ
              </div>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ padding: "10px 22px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Upload size={14} /> อัปโหลดเอกสาร
              </button>
            </div>
          )}

          {/* Folders + Templates */}
          {customTemplates.length > 0 && (
            <div style={{ display: "flex", gap: 20 }}>
              {/* Folder sidebar */}
              <div style={{ width: 200, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Folders</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <button onClick={() => setActiveFolder(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                      background: activeFolder === null ? "rgba(99,102,241,0.12)" : "transparent",
                      border: `1px solid ${activeFolder === null ? "rgba(99,102,241,0.3)" : "transparent"}`,
                      color: activeFolder === null ? "#a5b4fc" : "var(--tx-muted)",
                      fontWeight: activeFolder === null ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}>
                    <FolderOpen size={14} color={activeFolder === null ? "#6366f1" : "var(--tx-dim)"} />
                    ทั้งหมด
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--tx-faint)" }}>{customTemplates.length}</span>
                  </button>

                  {allFolders.map(folder => {
                    const count = customTemplates.filter(t => (t.folder ?? "ทั่วไป") === folder).length
                    const color = folderColor(folder)
                    const isActive = activeFolder === folder
                    return (
                      <button key={folder} onClick={() => setActiveFolder(isActive ? null : folder)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8,
                          background: isActive ? `${color}14` : "transparent",
                          border: `1px solid ${isActive ? `${color}35` : "transparent"}`,
                          color: isActive ? color : "var(--tx-muted)",
                          fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left",
                          transition: "all .15s",
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-card-hover)" }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder}</span>
                        <span style={{ fontSize: 11, color: "var(--tx-faint)", flexShrink: 0 }}>{count}</span>
                      </button>
                    )
                  })}

                  {/* New folder */}
                  {newFolderMode ? (
                    <div style={{ display: "flex", gap: 4, padding: "4px 4px" }}>
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newFolderName.trim()) { setActiveFolder(newFolderName.trim()); setNewFolderMode(false); setNewFolderName("") }
                          if (e.key === "Escape") { setNewFolderMode(false); setNewFolderName("") }
                        }}
                        placeholder="ชื่อ Folder"
                        style={{ flex: 1, background: "var(--bg-input)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "5px 8px", color: "var(--tx-primary)", fontSize: 12, outline: "none" }}
                      />
                      <button onClick={() => { if (newFolderName.trim()) { setActiveFolder(newFolderName.trim()); setNewFolderMode(false); setNewFolderName("") } }}
                        style={{ width: 26, height: 26, borderRadius: 6, background: "#6366f1", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setNewFolderMode(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, background: "transparent", border: "1px dashed rgba(99,102,241,0.2)", color: "var(--tx-faint)", fontSize: 12, cursor: "pointer" }}>
                      <FolderPlus size={13} /> สร้าง Folder ใหม่
                    </button>
                  )}
                </div>
              </div>

              {/* Template cards */}
              <div style={{ flex: 1 }}>
                {templatesInFolder.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", border: "1px dashed var(--bg-border)", borderRadius: 12 }}>
                    <FolderOpen size={36} color="var(--tx-faint)" style={{ marginBottom: 10 }} />
                    <div style={{ color: "var(--tx-faint)", fontSize: 13 }}>Folder นี้ยังว่างอยู่</div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 }}>
                    {templatesInFolder.map(t => {
                      const color = folderColor(t.folder ?? "ทั่วไป")
                      return (
                        <div key={t.id}
                          style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 14, padding: "14px 16px", position: "relative", transition: "border-color .15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = color + "55"}
                          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--bg-border)"}>

                          {/* Folder tag */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color, background: color + "18", padding: "2px 8px", borderRadius: 20 }}>
                              {t.folder ?? "ทั่วไป"}
                            </span>
                            {/* Move menu trigger */}
                            <button onClick={e => { e.stopPropagation(); setMovingId(movingId === t.id ? null : t.id); setMoveTarget("") }}
                              style={{ width: 24, height: 24, borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <MoreHorizontal size={13} />
                            </button>
                          </div>

                          {/* Move dropdown */}
                          {movingId === t.id && (
                            <div style={{ position: "absolute", top: 38, right: 10, zIndex: 100, background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 10, padding: 10, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
                              onClick={e => e.stopPropagation()}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx-faint)", marginBottom: 6 }}>ย้ายไป Folder</div>
                              {allFolders.filter(f => f !== (t.folder ?? "ทั่วไป")).map(f => (
                                <button key={f} onClick={() => moveToFolder(t.id, f)}
                                  style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", borderRadius: 6, background: "transparent", border: "none", color: "var(--tx-muted)", fontSize: 13, cursor: "pointer" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                  📁 {f}
                                </button>
                              ))}
                              <div style={{ borderTop: "1px solid var(--bg-border)", marginTop: 6, paddingTop: 6 }}>
                                <div style={{ display: "flex", gap: 4 }}>
                                  <input value={moveTarget} onChange={e => setMoveTarget(e.target.value)} placeholder="Folder ใหม่"
                                    style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--bg-border)", borderRadius: 6, padding: "5px 7px", color: "var(--tx-primary)", fontSize: 12, outline: "none" }} />
                                  <button onClick={() => { if (moveTarget.trim()) moveToFolder(t.id, moveTarget.trim()) }}
                                    style={{ padding: "5px 10px", background: "#6366f1", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, cursor: "pointer" }}>ย้าย</button>
                                </div>
                              </div>
                            </div>
                          )}

                          <div style={{ fontSize: 18, marginBottom: 6 }}>🧩</div>
                          <div style={{ fontWeight: 700, color: "var(--tx-primary)", fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--tx-faint)", marginBottom: 12 }}>
                            {t.variables?.length ?? 0} ตัวแปร · {t.category}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => openCustomTemplate(t)}
                              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 0", background: color + "15", border: `1px solid ${color}30`, borderRadius: 8, color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              ใช้ <ChevronRight size={11} />
                            </button>
                            <button onClick={e => deleteCustom(t.id, e)}
                              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BUILT-IN TEMPLATES TAB
      ══════════════════════════════════════════════════════════════ */}
      {tab === "builtin" && (
        <div>
          {/* Search + Category tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "0 0 220px" }}>
              <Search size={13} color="var(--tx-faint)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา template…"
                style={{ ...inputSt, paddingLeft: 30 }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "var(--bg-border)"} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATS.map(c => (
                <button key={c.id} onClick={() => setFilter(c.id)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, border: "1px solid",
                    borderColor: filter === c.id ? "#6366f1" : "var(--bg-border)",
                    background: filter === c.id ? "rgba(99,102,241,0.12)" : "var(--bg-card)",
                    color: filter === c.id ? "#a5b4fc" : "var(--tx-muted)",
                    fontSize: 13, cursor: "pointer", fontWeight: filter === c.id ? 600 : 400, transition: ".1s",
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid header */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <FileText size={14} color="var(--tx-dim)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx-primary)" }}>
              {filter === "all" ? `Templates ทั้งหมด (${filtered.length})` :
               filter === "recommended" ? `⭐ แนะนำสำหรับคุณ (${filtered.length})` :
               `${activeCat?.emoji} ${activeCat?.label} (${filtered.length})`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--tx-faint)" }}>
              <FileText size={36} style={{ marginBottom: 12 }} />
              <div>ไม่พบ Template ที่ตรงกับการค้นหา</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(234px, 1fr))", gap: 10 }}>
              {filtered.map(t => (
                <div key={t.id} onClick={() => openTemplate(t)}
                  style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 14, padding: "16px 16px 12px", cursor: "pointer", transition: "border-color .15s, transform .1s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = t.color + "55"; el.style.transform = "translateY(-1px)" }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--bg-border)"; el.style.transform = "" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: t.color + "18", border: `1px solid ${t.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "var(--tx-primary)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "var(--tx-faint)" }}>{t.nameEn}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--tx-dim)", marginBottom: 10, lineHeight: 1.5 }}>{t.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--tx-faint)" }}>{t.vars.length} ตัวแปร</span>
                    <span style={{ fontSize: 12, color: t.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>ใช้ <ChevronRight size={11} /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Variable Fill Modal ─────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setSelectedCustom(null) } }}>
          <div style={{ background: "var(--bg-main)", border: "1px solid var(--bg-border)", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px 14px", borderBottom: "1px solid var(--bg-border)", flexShrink: 0 }}>
              <div style={{ fontSize: 28 }}>{selected?.icon ?? "🧩"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "var(--tx-main)", fontSize: 16 }}>{selected?.name ?? selectedCustom?.name}</div>
                {selected && <div style={{ fontSize: 12, color: "var(--tx-faint)" }}>{selected.nameEn}</div>}
              </div>
              <button onClick={() => { setSelected(null); setSelectedCustom(null) }}
                style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg-card-hover)", border: "none", color: "var(--tx-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={13} />
              </button>
            </div>
            <div style={{ overflowY: "auto", padding: "18px 22px", flex: 1 }}>
              {activeVars.length === 0 ? (
                <p style={{ color: "var(--tx-dim)", fontSize: 14 }}>AI จะสร้างเอกสารจากชื่อ Template ได้เลย</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {activeVars.map(v => (
                    <div key={v.key}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--tx-dim)", marginBottom: 5 }}>
                        {v.label}{v.required && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
                      </label>
                      {v.multiline ? (
                        <textarea rows={3} value={varValues[v.key] ?? ""} placeholder={v.placeholder ?? ""}
                          onChange={e => setVarValues(p => ({ ...p, [v.key]: e.target.value }))}
                          style={{ ...inputSt, resize: "vertical" }}
                          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                          onBlur={e => e.target.style.borderColor = "var(--bg-border)"} />
                      ) : (
                        <input type="text" value={varValues[v.key] ?? ""} placeholder={v.placeholder ?? ""}
                          onChange={e => setVarValues(p => ({ ...p, [v.key]: e.target.value }))}
                          style={inputSt}
                          onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                          onBlur={e => e.target.style.borderColor = "var(--bg-border)"} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: "14px 22px", borderTop: "1px solid var(--bg-border)", flexShrink: 0, display: "flex", gap: 10 }}>
              <button onClick={() => { setSelected(null); setSelectedCustom(null) }}
                style={{ flex: 1, padding: "10px 0", background: "var(--bg-card)", border: "1px solid var(--bg-border)", borderRadius: 10, color: "var(--tx-muted)", fontSize: 14, cursor: "pointer" }}>
                ยกเลิก
              </button>
              <button onClick={generate} disabled={generating}
                style={{
                  flex: 2, padding: "10px 0",
                  background: generating ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: generating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                {generating ? <>⟳ AI กำลังสร้าง…</> : <><Sparkles size={14} /> Generate with AI</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TemplatesPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--tx-dim)" }}>กำลังโหลด…</div>}>
      <TemplatesPage />
    </Suspense>
  )
}
