import { jsPDF } from 'jspdf'

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, filename)
}

export function downloadPdfFile(filename, content) {
  const doc = new jsPDF()
  const margin = 15
  const lineHeight = 7
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - margin * 2

  let y = margin
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(filename.replace(/\.pdf$/i, ''), maxWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * lineHeight + 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(content, maxWidth)
  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += lineHeight
  }
  doc.save(filename)
}