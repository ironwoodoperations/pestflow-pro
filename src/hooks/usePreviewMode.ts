import { createContext, useContext } from 'react'

export const PreviewModeContext = createContext(false)

export function usePreviewMode() {
  return useContext(PreviewModeContext)
}
