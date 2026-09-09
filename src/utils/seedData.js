import { db } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const cargarDatosInicialesMussas = async () => {
  try {
    const snapProfes = await getDocs(collection(db, 'profesores'));
    if (!snapProfes.empty) {
      if (!window.confirm("Ya existen profesores cargados en la base de datos. ¿Deseas volver a cargarlos de todas formas?")) {
        return;
      }
    }

    const profesoresMap = {};
    const profesList = [
      { nombre: "Vicky", apellido: "", disciplina: "Mini Artistas / Comedia", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Martina", apellido: "", disciplina: "Coreo Babys / Infantil", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Cande", apellido: "Rivas", disciplina: "Urban Kids / Jazz Teens / Adicional", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Sol", apellido: "", disciplina: "Gimnasia Rítmica", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Sofia", apellido: "", disciplina: "Danza Clásica Infantil", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Cande", apellido: "Rondo", disciplina: "Urban Infantil / CREW", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Mica", apellido: "", disciplina: "Profesorado / Jazz", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Sofi", apellido: "", disciplina: "Contempo", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Lili", apellido: "", disciplina: "Danza Clásica", modalidad: "Porcentaje", porcentaje: 50 },
      { nombre: "Ani", apellido: "", disciplina: "Baile +30", modalidad: "Porcentaje", porcentaje: 50 }
    ];

    for (const profe of profesList) {
      const docRef = await addDoc(collection(db, 'profesores'), profe);
      profesoresMap[profe.nombre] = docRef.id;
    }

    const clasesList = [
      // 3 años
      { nombre: "Mini artistas (3 años)", profesorId: profesoresMap["Vicky"], dias: ["Martes", "Jueves"], horario: "17:30 a 18:30 hs", duracionMinutos: 60, grupo: "3 años" },
      
      // 4 a 6 años
      { nombre: "Coreo Babys (4-6 años)", profesorId: profesoresMap["Martina"], dias: ["Miércoles", "Viernes"], horario: "Mié 18:30-19:30 / Vie 18:00-19:00", duracionMinutos: 60, grupo: "4 a 6 años" },
      { nombre: "Urban kids (4-6 años)", profesorId: profesoresMap["Cande"], dias: ["Lunes", "Miércoles"], horario: "17:30 a 18:30 hs", duracionMinutos: 60, grupo: "4 a 6 años" },
      { nombre: "Gim. Rítmica (4-6 años)", profesorId: profesoresMap["Sol"], dias: ["Miércoles"], horario: "17:30 a 18:30 hs", duracionMinutos: 60, grupo: "4 a 6 años" },
      { nombre: "Mini artistas (4-6 años)", profesorId: profesoresMap["Vicky"], dias: ["Martes", "Jueves"], horario: "17:30 a 18:30 hs", duracionMinutos: 60, grupo: "4 a 6 años" },
      
      // 6 a 10 años
      { nombre: "Danza clásica infantil (6-10 años)", profesorId: profesoresMap["Sofia"], dias: ["Lunes", "Viernes"], horario: "Lun 17:30-18:30 / Vie 18:00-19:00", duracionMinutos: 60, grupo: "6 a 10 años" },
      { nombre: "Coreo Infantil (6-10 años)", profesorId: profesoresMap["Martina"], dias: ["Martes", "Jueves"], horario: "18:00 a 19:00 hs", duracionMinutos: 60, grupo: "6 a 10 años" },
      { nombre: "Jazz inf. Avanzado (6-10 años)", profesorId: profesoresMap["Cande"], dias: ["Lunes", "Miércoles"], horario: "18:30 a 19:30 hs", duracionMinutos: 60, grupo: "6 a 10 años" },
      { nombre: "Urban Infantil (6-10 años)", profesorId: profesoresMap["Cande"], dias: ["Martes"], horario: "18:30 a 19:30 hs", duracionMinutos: 60, grupo: "6 a 10 años" },
      { nombre: "Urban CREW (6-10 años)", profesorId: profesoresMap["Cande"], dias: ["Martes", "Jueves"], horario: "19:30 a 20:30 hs", duracionMinutos: 60, grupo: "6 a 10 años" },
      { nombre: "Comedia Musical (6-10 años)", profesorId: profesoresMap["Vicky"], dias: ["Martes"], horario: "19:00 a 20:30 hs", duracionMinutos: 90, grupo: "6 a 10 años" },
      { nombre: "Profesorado de Danza Jazz Infantil", profesorId: profesoresMap["Mica"], dias: ["Lunes"], horario: "18:30 a 19:30 hs", duracionMinutos: 60, grupo: "6 a 10 años", esProfesorado: true, precioFijoEfectivo: 70000 },
      
      // 11 a 14 años
      { nombre: "Jazz Teens (11-14 años)", profesorId: profesoresMap["Mica"], dias: ["Jueves"], horario: "18:30 a 19:30 hs", duracionMinutos: 60, grupo: "11 a 14 años" },
      { nombre: "Jazz Teens avanzado (11-14 años)", profesorId: profesoresMap["Cande"], dias: ["Lunes", "Miércoles"], horario: "19:30 a 20:30 hs", duracionMinutos: 60, grupo: "11 a 14 años" },
      { nombre: "Contempo (11-14 años)", profesorId: profesoresMap["Sofi"], dias: ["Viernes"], horario: "19:00 a 20:30 hs", duracionMinutos: 90, grupo: "11 a 14 años" },
      
      // 15 años o más
      { nombre: "Jazz principiantes (15+ años)", profesorId: profesoresMap["Mica"], dias: ["Jueves"], horario: "20:00 a 21:00 hs", duracionMinutos: 60, grupo: "15 años o más" },
      { nombre: "Jazz juvenil int/ avanzado (15+ años)", profesorId: profesoresMap["Mica"], dias: ["Lunes", "Miércoles"], horario: "19:00 a 20:30 hs", duracionMinutos: 90, grupo: "15 años o más" },
      { nombre: "Contempo (15+ años)", profesorId: profesoresMap["Sofi"], dias: ["Viernes"], horario: "19:00 a 20:30 hs", duracionMinutos: 90, grupo: "15 años o más" },
      { nombre: "Danza clásica (15+ años)", profesorId: profesoresMap["Lili"], dias: ["Martes", "Viernes"], horario: "Mar 20:30-21:30 / Vie 20:00-21:30", duracionMinutos: 75, grupo: "15 años o más" },
      
      // Adultos
      { nombre: "Baile +30 (Adultos)", profesorId: profesoresMap["Ani"], dias: ["Viernes"], horario: "19:00 a 20:00 hs", duracionMinutos: 60, grupo: "Adultos" },
      { nombre: "Jazz nivel principiante (Adultos)", profesorId: profesoresMap["Mica"], dias: ["Jueves"], horario: "19:30 a 20:30 hs", duracionMinutos: 60, grupo: "Adultos" },

      // Clase Especial Adicional
      { nombre: "Adicional con Cande (Media Hora)", profesorId: profesoresMap["Cande"], dias: ["Miércoles"], horario: "20:30 a 21:00 hs", duracionMinutos: 30, grupo: "Especial", esAdicionalFijo: true, precioFijoEfectivo: 19000 }
    ];

    for (const clase of clasesList) {
      await addDoc(collection(db, 'clases'), clase);
    }

    alert("¡Éxito! Se cargaron los 10 Profesores y las 22 Comisiones en Firebase.");
  } catch (e) {
    console.error("Error al cargar datos:", e);
    alert("Ocurrió un error cargando los datos iniciales.");
  }
};
