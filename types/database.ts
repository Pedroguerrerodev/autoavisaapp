// Tipos de la base de datos AutoAvisa

/** Roles de usuario dentro de un taller */
export type Rol = 'dueño' | 'trabajador'

/** Tipos de mantenimiento disponibles para avisos */
export type TipoAviso = 'itv' | 'aceite' | 'filtros' | 'revision' | 'neumaticos' | 'otro'

/** Estados posibles de un aviso */
export type EstadoAviso = 'pendiente' | 'enviado' | 'fallido'

/** Estados posibles de un trabajo */
export type EstadoTrabajo = 'en_curso' | 'listo' | 'entregado'

/** Taller registrado en la plataforma (tenant) */
export interface Taller {
    id: string
    nombre: string
    telefono_taller: string | null
    created_at: string
}

/** Perfil de usuario asociado a un taller */
export interface Perfil {
    id: string
    taller_id: string
    nombre: string
    rol: Rol
    created_at: string
}

/** Vehículo registrado por un taller */
export interface Vehiculo {
    id: string
    taller_id: string
    matricula: string
    marca: string
    modelo: string
    telefono_cliente: string
    nombre_cliente: string | null
    notas: string | null
    created_at: string
    updated_at: string
}

/** Aviso de mantenimiento programado para un vehículo */
export interface Aviso {
    id: string
    vehiculo_id: string
    taller_id: string
    tipo: TipoAviso
    fecha_programada: string
    mensaje_personalizado: string | null
    estado: EstadoAviso
    fecha_envio: string | null
    es_manual: boolean
    recurrencia_meses: number | null
    aviso_origen_id: string | null
    created_at: string
    updated_at: string
}

// Tipos para la API de WhatsApp

/** Datos requeridos para enviar un mensaje de WhatsApp */
export interface SendWhatsAppRequest {
    telefono: string
    nombre_cliente: string
    nombre_taller: string
    tipo_mantenimiento: TipoAviso
    mensaje: string
    matricula: string
}

/** Respuesta exitosa del envío de WhatsApp */
export interface SendWhatsAppResponse {
    estado: 'enviado'
    timestamp: string
    whatsapp_message_id?: string
}

/** Trabajo/reparación en curso asociado a un vehículo */
export interface Trabajo {
    id: string
    vehiculo_id: string
    taller_id: string
    descripcion: string
    estado: EstadoTrabajo
    created_at: string
    updated_at: string
    fecha_listo: string | null
    fecha_entregado: string | null
}
