import { CloudDownload } from 'lucide-react'
import { downloadTextFile } from '../utils/download'
import { generateRandomId } from '../utils/randomId'

export default function DownloadButton({ content, label = '', className = '' }) {
  return (
    <button
      onClick={() => downloadTextFile(`cavenote-${generateRandomId(7)}.txt`, content)}
      disabled={!content}
      className={`btn-notion ${className}`}
      title="Download note as .txt"
    >
      <CloudDownload className="h-5 w-5 max-sm:h-4 max-sm:w-4" />
      {label && <span className="hidden sm:inline text-sm">{label}</span>}
    </button>
  )
}