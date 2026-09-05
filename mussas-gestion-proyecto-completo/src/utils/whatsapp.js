export const enviarWspFichaSalud = (nombre, telefono, idAlumno) => {
  const linkFormulario = `https://mussas-gestion.vercel.app/ficha-salud/${idAlumno}`;
  const mensaje = `Hola ${nombre}! Te damos la bienvenida a Mussas. Por favor, completá tu ficha de salud obligatoria en el siguiente enlace: ${linkFormulario}`;
  
  const numLimpio = telefono.replace(/\D/g, '');
  const url = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`;
  
  window.open(url, '_blank');
};

export const enviarWspAvisoDeuda = (nombre, telefono, monto) => {
  const mensaje = `Hola ${nombre}, te recordamos que tenés pendiente el pago de tu cuota en Mussas por un total de $${monto}. Quedamos a disposición por cualquier consulta!`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};

export const enviarReciboWsp = (nombre, telefono, concepto, monto) => {
  const mensaje = `Hola ${nombre}! Te adjuntamos la confirmación de tu pago en Mussas:

Concepto: ${concepto}
Monto: $${monto}

¡Muchas gracias!`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};
