import { useState } from 'react'

const config = {
  decrypt: { title: 'Enter password', button: 'Decrypt', help: 'Enter the password to decrypt this note.', confirmField: false },
  save: { title: 'Set a password', button: 'Save', help: 'This password will be required to open this note.', confirmField: true },
  change: { title: 'Change password', button: 'Change', help: 'Enter a new password for this note.', confirmField: true, oldField: false },
}

export default function PasswordModal({ mode, onSubmit, error, onClose }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')
  const [loading, setLoading] = useState(false)
  const cfg = config[mode]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!password) { setLocalError('Password is required'); return }
    if (cfg.confirmField && password !== confirm) { setLocalError('Passwords do not match'); return }
    setLoading(true)
    try {
      await onSubmit(password)
    } catch (err) {
      setLocalError(err.message || 'Wrong password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm bg-notion-card rounded-lg border shadow-notion-modal dark:bg-notion-card-dark">
        <div className="p-5 sm:p-7 pb-6">
          <h2 className="text-lg font-semibold tracking-tight">{cfg.title}</h2>
          <p className="mt-1.5 text-sm text-notion-muted dark:text-notion-muted-dark leading-snug">{cfg.help}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input type="password" className="input-notion" placeholder={cfg.oldField ? 'Current password' : cfg.confirmField ? 'New password' : 'Password'} value={password}
              onChange={(e) => setPassword(e.target.value)} autoFocus />

            {cfg.confirmField && (
              <input type="password" className="input-notion" placeholder={cfg.oldField ? 'Confirm new password' : 'Confirm password'} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
            )}

            {(localError || error) && (
              <p className="text-sm text-red-500">{localError || error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {onClose && <button type="button" onClick={onClose} className="btn-notion">Cancel</button>}
              <button type="submit" className="btn-notion-primary" disabled={loading}>
                {loading ? 'Please wait...' : cfg.button}
              </button>
            </div>
          </form>
        </div>

        <div className="border-t px-5 sm:px-7 py-4 dark:border-notion-border-dark">
          <p className="text-xs text-notion-muted dark:text-notion-muted-dark">
            Your password never leaves your browser.
          </p>
        </div>
      </div>
    </div>
  )
}
