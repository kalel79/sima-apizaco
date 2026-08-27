import { useState, useEffect } from 'react'
import { Users, BarChart3, FileText, Settings, Paperclip, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useConfiguracionCtx } from '../contexts/ConfiguracionContext'
import { formatPeriodoLabel } from '../utils/periodo'
import { useDatosReporte } from '../hooks/useDatosReporte'
import { C } from '../theme.js'
import AvanceCaptura from './AvanceCaptura'
import AvanceCapturaMML from './admin/AvanceCapturaMML.jsx'
import GestionUsuarios from './admin/GestionUsuarios.jsx'
import PeriodoEvaluacion from './admin/PeriodoEvaluacion.jsx'
import ReportesAdmin from './admin/ReportesAdmin.jsx'
import MetasPorAnio from './admin/MetasPorAnio.jsx'
import SeguimientoEvidencias from './admin/SeguimientoEvidencias.jsx'

export default function AdminUsuarios() {
  const { isAdmin, isPlaneacion, isDirectivo } = useAuth()
  const puedeVerReportesAdmin = isAdmin || isPlaneacion || isDirectivo
  const TABS = [
    ...(isAdmin ? [{ id: 'usuarios', label: 'Gestión de Usuarios', icon: Users }] : []),
    ...((isAdmin || isPlaneacion) ? [{ id: 'captura', label: 'Avance de Captura', icon: BarChart3 }] : []),
    ...((isAdmin || isPlaneacion) ? [{ id: 'mml', label: 'Avance Expediente MML', icon: ClipboardList }] : []),
    ...(puedeVerReportesAdmin ? [{ id: 'evidencias', label: 'Seguimiento de Evidencias', icon: Paperclip }] : []),
    ...(puedeVerReportesAdmin ? [{ id: 'reportes', label: 'Reportes', icon: FileText }] : []),
  ]
  const [adminTab, setAdminTab] = useState(isAdmin ? 'usuarios' : (isPlaneacion ? 'captura' : 'reportes'))

  const { mesActual, anioActual, refetchCfg } = useConfiguracionCtx()
  const periodoLabel = formatPeriodoLabel(mesActual, anioActual)
  // Instancia única de los datos del reporte: la comparten PeriodoEvaluacion
  // (recarga al cambiar el periodo) y ReportesAdmin (consume para generar).
  const { global, ejes, indicadoresPorEje, loading: rLoading, error: rError, cargar } = useDatosReporte()

  // Precarga datos al montar el componente
  useEffect(() => { cargar() }, [cargar]) // eslint-disable-line

  return (
    <div>
      {TABS.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setAdminTab(t.id)}
              style={{
                background: adminTab === t.id ? `linear-gradient(135deg,${C.guindaDark},${C.guinda})` : C.bgPanel,
                border: `1px solid ${adminTab === t.id ? C.guinda : C.border}`,
                borderRadius: 8, color: adminTab === t.id ? C.txt : C.txtSub,
                padding: '0.55rem 1rem', fontSize: '0.75rem', fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer', letterSpacing: 1,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              <t.icon size={13}/> {t.label}
            </button>
          ))}
        </div>
      )}

      {adminTab === 'captura' && (isAdmin || isPlaneacion) && <AvanceCaptura/>}

      {adminTab === 'mml' && (isAdmin || isPlaneacion) && <AvanceCapturaMML/>}

      {adminTab === 'usuarios' && isAdmin && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: 3, color: C.dorado, textTransform: 'uppercase', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Settings size={12}/> Administración de Usuarios · Solo Administrador
          </div>

          <GestionUsuarios/>

          <PeriodoEvaluacion
            mesActual={mesActual} anioActual={anioActual} periodoLabel={periodoLabel}
            refetchCfg={refetchCfg} cargar={cargar}
          />

          <MetasPorAnio/>
        </div>
      )}

      {adminTab === 'evidencias' && puedeVerReportesAdmin && <SeguimientoEvidencias/>}

      {adminTab === 'reportes' && puedeVerReportesAdmin && (
        <div style={{ maxWidth: 560 }}>
          <ReportesAdmin
            global={global} ejes={ejes} indicadoresPorEje={indicadoresPorEje}
            rLoading={rLoading} rError={rError} cargar={cargar}
            mesActual={mesActual} anioActual={anioActual} periodoLabel={periodoLabel}
          />
        </div>
      )}
    </div>
  )
}
