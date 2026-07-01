"use client"

import { useState, useCallback } from "react"
import type { SheetData } from "@/types"

type Props = { data: SheetData; onChange: (data: SheetData) => void }

export default function SheetGrid({ data, onChange }: Props) {
  const [editCell, setEditCell] = useState<{ row: number; col: number } | null>(null)
  const [editVal, setEditVal] = useState("")

  const { headers, rows } = data

  function addRow() {
    onChange({ ...data, rows: [...rows, Array(headers.length).fill("")] })
  }

  function addCol() {
    const newHeader = `Col ${headers.length + 1}`
    onChange({ ...data, headers: [...headers, newHeader], rows: rows.map(r => [...r, ""]) })
  }

  function updateHeader(i: number, val: string) {
    const h = [...headers]; h[i] = val
    onChange({ ...data, headers: h })
  }

  function updateCell(r: number, c: number, val: string) {
    const newRows = rows.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row)
    onChange({ ...data, rows: newRows })
  }

  function commitEdit() {
    if (editCell) updateCell(editCell.row, editCell.col, editVal)
    setEditCell(null)
  }

  return (
    <div style={{ overflow: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ width: 40, padding: "8px 4px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--tx-faint)", fontSize: 11 }}>#</th>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: 0, background: "rgba(99,102,241,0.08)", border: "1px solid var(--bg-border)", minWidth: 120 }}>
                <input
                  value={h}
                  onChange={e => updateHeader(i, e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#a5b4fc", fontWeight: 700, fontSize: 12, padding: "8px 10px", textAlign: "center", boxSizing: "border-box" }}
                />
              </th>
            ))}
            <th style={{ width: 36, background: "transparent", border: "1px solid var(--bg-border)" }}>
              <button onClick={addCol} style={{ width: "100%", height: "100%", background: "none", border: "none", color: "var(--tx-faint)", cursor: "pointer", fontSize: 16 }}>+</button>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              <td style={{ padding: "6px 8px", background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--tx-faint)", fontSize: 11, textAlign: "center" }}>{ri + 1}</td>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: 0, border: "1px solid var(--bg-border)", background: editCell?.row === ri && editCell?.col === ci ? "rgba(99,102,241,0.08)" : "transparent" }}>
                  {editCell?.row === ri && editCell?.col === ci ? (
                    <input
                      autoFocus
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === "Tab") commitEdit() }}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--tx-primary)", fontSize: 13, padding: "6px 10px", boxSizing: "border-box" }}
                    />
                  ) : (
                    <div
                      onDoubleClick={() => { setEditCell({ row: ri, col: ci }); setEditVal(cell) }}
                      style={{ padding: "6px 10px", color: cell.startsWith("=") ? "#10b981" : "var(--tx-primary)", minHeight: 32, cursor: "default" }}
                    >
                      {cell}
                    </div>
                  )}
                </td>
              ))}
              <td style={{ border: "1px solid var(--bg-border)" }} />
            </tr>
          ))}
          <tr>
            <td colSpan={headers.length + 2} style={{ padding: 4, border: "1px solid var(--bg-border)" }}>
              <button onClick={addRow} style={{ width: "100%", background: "none", border: "none", color: "var(--tx-faint)", cursor: "pointer", padding: "6px 0", fontSize: 13 }}>+ เพิ่มแถว</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
