// =================== CONFIGURACIÓN DE FIREBASE ===================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDz-koArBKFUb18f677L6161VqKQ1ZdVvo",
  authDomain: "control-partes.firebaseapp.com",
  projectId: "control-partes",
  storageBucket: "control-partes.firebasestorage.app",
  messagingSenderId: "408084645027",
  appId: "1:408084645027:web:926ecefaba0dc9643aab16"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =================== DATOS DE USUARIOS ===================
const usuarios = [
  { nombre: "admin", legajo: "0000" },
  { nombre: "Acevedo Nelson", legajo: "123" },
  { nombre: "Arias Federico", legajo: "124" },
  { nombre: "Rodriguez Gabriel", legajo: "125" },
  { nombre: "Viñas Gabriel", legajo: "126" },
];

// =================== DATOS DE INTERNOS ===================
const internos = [
  "A-299", "A-316", "C-111", "C-136", "C-157", "C-165", "RC-680", "T-434", "TR-512"
];

const loginSection = document.getElementById("login-section");
const formSection = document.getElementById("form-section");
const adminSection = document.getElementById("admin-section");
const usuarioSelect = document.getElementById("usuario");
const legajoInput = document.getElementById("legajo");
const btnLogin = document.getElementById("btnLogin");
const errorLogin = document.getElementById("errorLogin");
const userActive = document.getElementById("userActive");
const btnGuardar = document.getElementById("btnGuardar");
const btnSalir = document.getElementById("btnSalir");
const msgGuardado = document.getElementById("msgGuardado");
const tablaPartes = document.getElementById("tablaPartes");
const filtroInput = document.getElementById("filtro");
const btnExportar = document.getElementById("btnExportar");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");
const selectInterno = document.getElementById("interno");
const cargoCombustible = document.getElementById("cargoCombustible");
const datosCombustible = document.getElementById("datosCombustible");

let usuarioActivo = null;

// =================== LOGIN ===================
btnLogin.addEventListener("click", () => {
  const nombre = usuarioSelect.value;
  const legajo = legajoInput.value.trim();

  const usuario = usuarios.find(u => u.nombre === nombre && u.legajo === legajo);

  if (!usuario) {
    errorLogin.textContent = "Usuario o legajo incorrecto.";
    return;
  }

  errorLogin.textContent = "";
  usuarioActivo = usuario.nombre;
  localStorage.setItem("usuarioActivo", usuarioActivo);
  loginSection.classList.add("hidden");

  if (usuarioActivo === "admin") {
    adminSection.classList.remove("hidden");
    mostrarResumen();
  } else {
    formSection.classList.remove("hidden");
    userActive.textContent = `Usuario: ${usuarioActivo}`;
  }
});

// =================== CARGAR INTERNOS ===================
internos.forEach(i => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  selectInterno.appendChild(opt);
});

cargoCombustible.addEventListener("change", () => {
  datosCombustible.classList.toggle("hidden", cargoCombustible.value !== "si");
});

// =================== GUARDAR PARTE EN FIRESTORE ===================
btnGuardar.addEventListener("click", async () => {
  const fecha = document.getElementById("fecha").value;
  const interno = document.getElementById("interno").value;
  const final = document.getElementById("final").value;
  const novedades = document.getElementById("novedades").value;
  const litros = document.getElementById("litros").value;
  const kmCarga = document.getElementById("kmCarga").value;
  const cargo = cargoCombustible.value;

  if (!fecha || !interno || !final) {
    msgGuardado.textContent = "Completá todos los campos obligatorios.";
    msgGuardado.style.color = "#e74c3c";
    return;
  }

  let combustible = "No cargó combustible";
  if (cargo === "si" && litros && kmCarga) {
    combustible = `${litros} L - ${kmCarga} km`;
  }

  try {
    await addDoc(collection(db, "partesDiarios"), {
  usuario: usuarioActivo,
  fecha: fecha,
  interno: interno,
  final: final,
  combustible: combustible,
  novedades: novedades,
  timestamp: new Date()
});

    });

    msgGuardado.textContent = "Parte guardado correctamente ✅";
    msgGuardado.style.color = "#27ae60";

    document.getElementById("final").value = "";
    document.getElementById("novedades").value = "";
    document.getElementById("litros").value = "";
    document.getElementById("kmCarga").value = "";
    cargoCombustible.value = "no";
    datosCombustible.classList.add("hidden");
  } catch (error) {
    console.error("Error al guardar:", error);
    msgGuardado.textContent = "Error al guardar el parte ❌";
    msgGuardado.style.color = "#e74c3c";
  }
});

// =================== MOSTRAR ÚLTIMO PARTE ===================
selectInterno.addEventListener("change", async () => {
  const interno = selectInterno.value;
  const partesSnap = await getDocs(collection(db, "partesDiarios"));
  const partes = partesSnap.docs.map(d => d.data());
  const ultimos = partes.filter(p => p.interno === interno);

  if (ultimos.length === 0) {
    document.getElementById("ultimoParte").classList.add("hidden");
    return;
  }

  const ultimo = ultimos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
  document.getElementById("uFecha").textContent = ultimo.fecha;
  document.getElementById("uFinal").textContent = ultimo.final;
  document.getElementById("uCombustible").textContent = ultimo.combustible;
  document.getElementById("uNovedades").textContent = ultimo.novedades;
  document.getElementById("ultimoParte").classList.remove("hidden");
});

// =================== SALIR ===================
btnSalir.addEventListener("click", () => location.reload());
btnSalirAdmin.addEventListener("click", () => location.reload());

// =================== RESUMEN ADMIN ===================
async function mostrarResumen() {
  const partesSnap = await getDocs(collection(db, "partesDiarios"));
  const partes = partesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const filtro = filtroInput.value.toLowerCase();
  tablaPartes.innerHTML = "";

  partes
    .filter(p => Object.values(p).some(v => v && v.toString().toLowerCase().includes(filtro)))
    .forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.usuario}</td>
        <td>${p.fecha}</td>
        <td>${p.interno}</td>
        <td>${p.final}</td>
        <td>${p.combustible}</td>
        <td>${p.novedades || "-"}</td>
        <td><button onclick="eliminarParte('${p.id}')">🗑️</button></td>
      `;
      tablaPartes.appendChild(fila);
    });
}

filtroInput.addEventListener("input", mostrarResumen);

// =================== ELIMINAR PARTE ===================
async function eliminarParte(id) {
  await deleteDoc(doc(db, "partesDiarios", id));
  mostrarResumen();
}
window.eliminarParte = eliminarParte; // 🔹 para que funcione el botón en el HTML

// =================== EXPORTAR CSV ===================
btnExportar.addEventListener("click", async () => {
  const partesSnap = await getDocs(collection(db, "partesDiarios"));
  const partes = partesSnap.docs.map(d => d.data());

  if (partes.length === 0) return alert("No hay partes para exportar.");

  const encabezado = ["Usuario", "Fecha", "Interno", "Final", "Combustible", "Novedades"];
  const filas = partes.map(p => [p.usuario, p.fecha, p.interno, p.final, p.combustible, p.novedades]);
  const csv = [encabezado, ...filas].map(e => e.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "partes_diarios.csv";
  a.click();
});

// =================== SERVICE WORKER ===================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker registrado ✅"))
      .catch(err => console.log("Error al registrar Service Worker:", err));
  });
}


