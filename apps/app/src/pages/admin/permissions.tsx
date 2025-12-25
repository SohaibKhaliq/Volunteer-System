import React, { useEffect, useState } from 'react'
import adminApi from '@/lib/api'

export default function AdminPermissions() {
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    adminApi.listPermissions().then((res: any) => {
      setPermissions(res.data ?? res)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Permissions</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {permissions.map((p) => (
            <li key={p.id} className="py-2 border-b">
              <strong>{p.name}</strong> — {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
