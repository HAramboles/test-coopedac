// Servicios que son llamados en la aplicacion

export const servicio_busqueda_personas_crear:string = '**/persona/personas?page=1&size=10';
export const servicio_busqueda_personas_editar:string = '**/persona/personas?page=1&size=15';
export const servicios_datos_persona_orden_pago:string = '**/captaciones_firmantes/get_captaciones';
export const servicio_check_session:string = '**/sesiones_en_transito/check_session';
export const servicio_cajas:string = '**/personal_caja/caja';