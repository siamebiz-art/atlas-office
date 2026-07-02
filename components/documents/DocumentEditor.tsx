"use client"

import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react"

export type SelectionInfo = {
  selectedHtml: string
  position: { top: number; left: number }
} | null

export interface DocumentEditorHandle {
  replaceSelection: (newHtml: string) => void
  getDiv: () => HTMLDivElement | null
}

type Props = {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
  onSelectionChange?: (info: SelectionInfo) => void
}

const DocumentEditor = forwardRef<DocumentEditorHandle, Props>(
  function DocumentEditor({ content, onChange, readOnly, onSelectionChange }, externalRef) {
    const divRef = useRef<HTMLDivElement>(null)
    const savedRange = useRef<Range | null>(null)
    const lastContent = useRef<string>("")

    useImperativeHandle(externalRef, () => ({
      replaceSelection(newHtml: string) {
        if (!savedRange.current) return
        const sel = window.getSelection()
        if (sel) {
          sel.removeAllRanges()
          sel.addRange(savedRange.current)
        }
        document.execCommand("insertHTML", false, newHtml)
        savedRange.current = null
        if (divRef.current) {
          lastContent.current = divRef.current.innerHTML
          onChange(divRef.current.innerHTML)
        }
      },
      getDiv: () => divRef.current,
    }))

    // Set initial content on mount
    useEffect(() => {
      if (divRef.current && content) {
        divRef.current.innerHTML = content
        lastContent.current = content
      }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync when AI updates content from outside
    useEffect(() => {
      if (!divRef.current) return
      if (content !== lastContent.current && content) {
        divRef.current.innerHTML = content
        lastContent.current = content
      }
    }, [content])

    const handleInput = useCallback(() => {
      if (!divRef.current) return
      const html = divRef.current.innerHTML
      lastContent.current = html
      onChange(html)
    }, [onChange])

    // Markdown shortcuts + Tab indent
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      // Tab key — indent like Microsoft Word
      if (e.key === "Tab") {
        e.preventDefault()
        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) return

        // In a list item: increase/decrease indent level
        let node: Node | null = sel.getRangeAt(0).startContainer
        while (node && node !== divRef.current) {
          if (node.nodeName === "LI") {
            document.execCommand(e.shiftKey ? "outdent" : "indent")
            handleInput()
            return
          }
          node = node.parentNode
        }

        // Regular text: insert tab stop (2 em-spaces ≈ Word's 0.5" default tab)
        if (!e.shiftKey) {
          document.execCommand("insertHTML", false, "&emsp;&emsp;")
        }
        handleInput()
        return
      }

      if (e.key === " ") {
        const sel = window.getSelection()
        if (!sel || !sel.rangeCount) return
        const range = sel.getRangeAt(0)
        if (!range.collapsed) return
        const node = range.startContainer
        if (node.nodeType !== Node.TEXT_NODE) return
        const text = (node.textContent ?? "").slice(0, range.startOffset)

        let format = ""
        let charsToDelete = 0

        if (text === "#")   { format = "h1"; charsToDelete = 1 }
        else if (text === "##")  { format = "h2"; charsToDelete = 2 }
        else if (text === "###") { format = "h3"; charsToDelete = 3 }
        else if (text === "-")   { format = "ul"; charsToDelete = 1 }
        else if (text === "1.")  { format = "ol"; charsToDelete = 2 }

        if (format) {
          e.preventDefault()
          // Delete the markdown prefix
          const delRange = document.createRange()
          delRange.setStart(node, 0)
          delRange.setEnd(node, charsToDelete)
          sel.removeAllRanges()
          sel.addRange(delRange)
          document.execCommand("delete")
          // Apply format
          if (format === "ul") document.execCommand("insertUnorderedList")
          else if (format === "ol") document.execCommand("insertOrderedList")
          else document.execCommand("formatBlock", false, format)
          handleInput()
        }
      }

      // Ctrl+K → command palette (future)
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        // TODO: open command palette
      }
    }

    function handleSelectionChange() {
      if (!onSelectionChange) return
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        onSelectionChange(null)
        return
      }
      const range = sel.getRangeAt(0)
      if (!divRef.current?.contains(range.commonAncestorContainer)) {
        onSelectionChange(null)
        return
      }
      const selectedText = sel.toString().trim()
      if (!selectedText) { onSelectionChange(null); return }

      savedRange.current = range.cloneRange()
      const fragment = range.cloneContents()
      const tmp = document.createElement("div")
      tmp.appendChild(fragment)
      const selectedHtml = tmp.innerHTML

      const rect = range.getBoundingClientRect()
      onSelectionChange({
        selectedHtml,
        position: { top: rect.top, left: rect.left + rect.width / 2 },
      })
    }

    function handleMouseUp() {
      // Small delay so the selection is fully settled
      setTimeout(handleSelectionChange, 20)
    }

    function handleKeyUp(e: React.KeyboardEvent) {
      if (e.shiftKey) setTimeout(handleSelectionChange, 20)
    }

    return (
      <>
        <div
          ref={divRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onMouseUp={handleMouseUp}
          className="doc-content"
          style={{
            minHeight: 520, outline: "none",
            color: "var(--tx-primary, #e2e8f0)", fontSize: 16,
            lineHeight: 2.0, caretColor: "#6366f1",
            fontFamily: "'Sarabun', 'TH Sarabun PSK', 'TH Sarabun New', sans-serif",
          }}
          data-placeholder="เริ่มพิมพ์หรือสั่ง AI ให้สร้างเนื้อหา…"
        />
        <style>{`
          .doc-content:empty:before {
            content: attr(data-placeholder);
            color: var(--tx-faint, #334155);
            pointer-events: none;
          }
          .doc-content h1 { font-size: 2em; font-weight: 800; margin: 0.6em 0 0.3em; }
          .doc-content h2 { font-size: 1.5em; font-weight: 700; margin: 0.6em 0 0.3em; }
          .doc-content h3 { font-size: 1.2em; font-weight: 600; margin: 0.5em 0 0.25em; }
          .doc-content p { margin: 0 0 0.75em; }
          .doc-content ul, .doc-content ol { padding-left: 1.5em; margin: 0.5em 0; }
          .doc-content li { margin: 0.25em 0; }
          .doc-content strong { font-weight: 700; }
          .doc-content em { font-style: italic; }
          .doc-content a { color: #818cf8; text-decoration: underline; }
          .doc-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          .doc-content th, .doc-content td { border: 1px solid var(--bg-border, rgba(255,255,255,0.1)); padding: 8px 12px; text-align: left; }
          .doc-content th { background: rgba(99,102,241,0.1); font-weight: 600; }
          .doc-content blockquote { border-left: 3px solid #6366f1; padding-left: 1em; color: var(--tx-muted); margin: 0.75em 0; }
          .doc-content img { max-width: 100%; border-radius: 8px; margin: 8px 0; display: block; }
          .doc-content img:hover { outline: 2px solid rgba(99,102,241,0.5); cursor: pointer; }
        `}</style>
      </>
    )
  }
)

export default DocumentEditor
