import { createContext, useContext } from 'react'

export const ConfiguracionContext = createContext({
  mesActual:   5,
  anioActual:  2026,
  loading:     true,
  refetchCfg:  () => {},
})

export function useConfiguracionCtx() {
  return useContext(ConfiguracionContext)
}
