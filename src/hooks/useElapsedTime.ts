import { useState, useEffect } from 'react'

export function useElapsedTime(startTime: Date | undefined) {
  const [elapsed, setElapsed] = useState('00:00')

  useEffect(() => {
    if (!startTime) return

    const updateElapsed = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      const minutes = Math.floor(diff / 60).toString().padStart(2, '0')
      const seconds = (diff % 60).toString().padStart(2, '0')
      setElapsed(`${minutes}:${seconds}`)
    }

    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return elapsed
}

