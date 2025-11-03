// client/src/utils/validarRut.js

export const validarRut = (rut) => {
  if (!rut) return false;

  // Elimina puntos y guiones
  let rutLimpio = rut.replace(/[.-]/g, '');

  // Debe tener al menos 2 dígitos: 1 dígito + 1 dígito verificador
  if (rutLimpio.length < 2) return false;

  // Separa el dígito verificador
  let dv = rutLimpio.slice(-1).toUpperCase();
  let cuerpo = rutLimpio.slice(0, -1);

  // El cuerpo debe ser numérico
  if (!/^\d+$/.test(cuerpo)) return false;

  // Calcula el dígito verificador esperado
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  let dvEsperado = 11 - (suma % 11);
  dvEsperado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dv === dvEsperado;
};