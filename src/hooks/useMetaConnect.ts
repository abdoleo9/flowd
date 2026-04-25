'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export type MetaChannel = 'instagram' | 'messenger' | 'whatsapp'
export type ConnectStatus = 'idle' | 'connecting' | 'connected' | 'error'

export function useMetaConnect(channel: MetaChannel, initialConnected = false) {
  const [status, setStatus] = useState<ConnectStatus>(
    initialConnected ? 'connected' : 'idle'
  )

  useEffect(() => {
    setStatus(initialConnected ? 'connected' : 'idle')
  }, [initialConnected])

  const connect = useCallback(() => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `/api/integrations/meta/connect?channel=${channel}`,
      `flowd_connect_${channel}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    )

    if (!popup) {
      toast.error('Popup blocked. Please allow popups for this site and try again.')
      return
    }

    setStatus('connecting')

    // cleanup is a ref-like object so both onMessage and the interval can call it
    // after closedCheck is assigned
    // eslint-disable-next-line prefer-const
    let closedCheckId: ReturnType<typeof setInterval> | undefined

    function cleanup() {
      window.removeEventListener('message', onMessage)
      if (closedCheckId !== undefined) clearInterval(closedCheckId)
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'META_OAUTH_SUCCESS' && event.data.channel === channel) {
        setStatus('connected')
        toast.success(
          `${channel.charAt(0).toUpperCase() + channel.slice(1)} connected successfully!`
        )
        cleanup()
      }

      if (event.data?.type === 'META_OAUTH_ERROR') {
        setStatus('error')
        toast.error(`Failed to connect ${channel}. Please try again.`)
        cleanup()
      }
    }

    window.addEventListener('message', onMessage)

    // Detect if user manually closed the popup
    closedCheckId = setInterval(() => {
      if (popup.closed) {
        cleanup()
        setStatus((prev) => (prev === 'connecting' ? 'idle' : prev))
      }
    }, 500)
  }, [channel])

  const disconnect = useCallback(() => {
    setStatus('idle')
  }, [])

  return { status, connect, disconnect }
}
