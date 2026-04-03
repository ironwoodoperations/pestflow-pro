import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TENANT_ID = import.meta.env.VITE_TENANT_ID

export function useGoogleAnalytics() {
  useEffect(() => {
    const injectGA = async () => {
      // Load GA ID from settings
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('tenant_id', TENANT_ID)
        .eq('key', 'integrations')
        .single()

      const gaId = data?.value?.google_analytics_id
      if (!gaId || gaId.trim() === '') return

      // Don't inject twice
      if (document.getElementById('ga-script')) return

      // Inject gtag script
      const script1 = document.createElement('script')
      script1.id = 'ga-script'
      script1.async = true
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      document.head.appendChild(script1)

      // Inject gtag init
      const script2 = document.createElement('script')
      script2.id = 'ga-init'
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `
      document.head.appendChild(script2)
    }

    injectGA()
  }, [])
}
