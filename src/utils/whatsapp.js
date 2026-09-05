export const enviarWspFichaSalud = (nombre, telefono, dni) => {
  const linkFormulario = `https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform?usp=pp_url&entry.DNI=${dni}`;
  const mensaje = `¡Hola ${nombre}! Te damos la bienvenida a Mussas. Por favor, completá tu ficha de salud obligatoria en el siguiente enlace: ${linkFormulario}`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};

export const enviarWspAvisoDeuda = (nombre, telefono, monto) => {
  const mensaje = `Hola ${nombre}, te recordamos desde Mussas que registrás un saldo pendiente de $${monto}. ¡Quedamos a disposición por cualquier consulta!`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};

export const enviarReciboWsp = (nombre, telefono, concepto, monto) => {
  const mensaje = `¡Hola ${nombre}! Confirmamos la recepción de tu pago en Mussas:

📌 Concepto: ${concepto}
💵 Monto: $${monto.toLocaleString()}

¡Muchas gracias por acompañarnos!`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};

export const enviarWspCumple = (nombre, telefono) => {
  const mensaje = `¡Feliz Cumpleaños ${nombre}! 🎉🎂 Todo el equipo de Mussas te desea un día hermoso lleno de danza y alegría. ¡A celebrar! 💃✨`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};

export const enviarWspGrupoClase = (telefono, claseNombre, comunicado) => {
  const mensaje = `[MUSSAS AVISO - ${claseNombre.toUpperCase()}]

${comunicado}`;
  const numLimpio = telefono.replace(/\D/g, '');
  window.open(`https://api.whatsapp.com/send?phone=${numLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
};
