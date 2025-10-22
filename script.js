// ====== script.js ======

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ====== Config Firebase ====== */
const firebaseConfig = {
  apiKey: "AIzaSyB7eE1ZOWzvCXTQQy5suJSFSkFWMZrTuE",
  authDomain: "control-partes-v2.firebaseapp.com",
  projectId: "control-partes-v2",
  storageBucket: "control-partes-v2.firebasestorage.app",
  messagingSenderId: "947187973810",
  appId: "1:947187973810:web:6b5507c430b5f221173a47"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ====== Usuarios y datos ====== */
const usuarios = [
  { nombre: "admin", legajo: "0000" },
  { nombre: "Acevedo Nelson", legajo: "123" },
  { nombre: "Arias Federico", legajo: "124" },
  { nombre: "Rodriguez Gabriel", legajo: "125" },
  { nombre: "Viñas Gabriel", legajo: "126" },
];
const internos = ["A-299", "A-316", "C-111", "C-136", "C-157", "C-165", "RC-680", "T-434", "TR-512"];

/* ====== DOM ====== */
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
let adminUnsubscribe = null;

/* ====== Helpers ====== */
function showMsg(el, text, color) {
  el.textContent = text;
  el.style.color = color || "#000";
}
function setSavingState(on) {
  btnGuardar.disabled = on;
  btnGuardar.textContent = on ? "Guardando..." : "Guardar parte";
}

/* ====== LOGIN ====== */
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
    iniciarListenerAdmin();
  } else {
    formSection.classList.remove("hidden");
    userActive.textContent = `Usuario: ${usuarioActivo}`;
  }
});

/* ====== Cargar internos ====== */
internos.forEach(i => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = i;
  selectInterno.appendChild(opt);
});
cargoCombustible.addEventListener("change", () => {
  datosCombustible.classList.toggle("hidden", cargoCombustible.value !== "si");
});

/* ====== GUARDAR PARTE ====== */
btnGuardar.addEventListener("click", async () => {
  const fecha = document.getElementById("fecha").value;
  const interno = document.getElementById("interno").value;
  const final = document.getElementById("final").value;
  const novedades = document.getElementById("novedades").value;
  const litros = document.getElementById("litros").value;
  const kmCarga = document.getElementById("kmCarga").value;
  const cargo = cargoCombustible.value;

  if (!usuarioActivo) {
    showMsg(msgGuardado, "Iniciá sesión primero.", "#e74c3c");
    return;
  }
  if (!fecha || !interno || !final) {
    showMsg(msgGuardado, "Completá fecha, interno y final.", "#e74c3c");
    return;
  }

  let combustible = "No cargó combustible";
  if (cargo === "si" && litros && kmCarga)
    combustible = `${litros} L - ${kmCarga} km`;

  const parteObj = {
    usuario: usuarioActivo,
    fecha,
    interno,
    final,
    combustible,
    novedades: novedades || "",
    timestamp: new Date()
  };

  setSavingState(true);
  try {
  const ref = await addDoc(collection(db, "partesDiarios"), parteObj);

    console.log("✅ Parte guardado en Firestore, id:", ref.id);
    showMsg(msgGuardado, "Parte guardado correctamente ✅", "#27ae60");

    // limpiar formulario
    document.getElementById("final").value = "";
    document.getElementById("novedades").value = "";
    document.getElementById("litros").value = "";
    document.getElementById("kmCarga").value = "";
    cargoCombustible.value = "no";
    datosCombustible.classList.add("hidden");
  } catch (err) {
    console.error("❌ Error al guardar parte:", err);
    showMsg(msgGuardado, "Error al guardar parte ❌", "#e74c3c");
  } finally {
    setSavingState(false);
  }
});

/* ====== ADMIN - Escuchar partes ====== */
function iniciarListenerAdmin() {
  if (adminUnsubscribe) {
    adminUnsubscribe();
    adminUnsubscribe = null;
  }

  try {
    const q = query(collection(db, "partesDiarios"), orderBy("timestamp", "desc"));
    adminUnsubscribe = onSnapshot(q, (snapshot) => {
      const partes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log("📡 Escuchando cambios:", partes.length, "partes encontrados");
      renderTablaPartes(partes);
    }, err => {
      console.error("Error onSnapshot:", err);
      showMsg(msgGuardado, "Error al recibir partes (ver consola)", "#e74c3c");
    });
  } catch (err) {
    console.error("Error iniciarListenerAdmin:", err);
  }
}

function renderTablaPartes(partes) {
  const filtro = filtroInput.value?.toLowerCase() || "";
  tablaPartes.innerHTML = "";
  partes
    .filter(p => {
      if (!filtro) return true;
      return Object.values(p).some(v => v && v.toString().toLowerCase().includes(filtro));
    })
    .forEach(p => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${p.usuario || "-"}</td>
        <td>${p.fecha || "-"}</td>
        <td>${p.interno || "-"}</td>
        <td>${p.final || "-"}</td>
        <td>${p.combustible || "-"}</td>
        <td>${p.novedades || "-"}</td>
        <td><button onclick="eliminarParte('${p.id}')">🗑️</button></td>
      `;
      tablaPartes.appendChild(fila);
    });
}

/* ====== Eliminar parte ====== */
async function eliminarParte(id) {
  try {
    await deleteDoc(doc(db, "partesDiarios", id));
    console.log("🗑️ Parte eliminado:", id);
  } catch (err) {
    console.error("Error eliminar parte:", err);
  }
}
window.eliminarParte = eliminarParte;

/* ====== Exportar CSV ====== */
btnExportar.addEventListener("click", async () => {
  try {
    const snap = await getDocs(collection(db, "partesDiarios"));
    const partes = snap.docs.map(d => d.data());
    if (!partes.length) return alert("No hay partes para exportar.");

    const encabezado = ["Usuario","Fecha","Interno","Final","Combustible","Novedades"];
    const filas = partes.map(p => [p.usuario,p.fecha,p.interno,p.final,p.combustible,p.novedades]);
    const csv = [encabezado, ...filas].map(e => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "partes_diarios.csv";
    a.click();
  } catch (err) {
    console.error("Error exportar CSV:", err);
  }
});

/* ====== Service Worker ====== */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js?v=4")
    .then(() => console.log("✅ Service Worker registrado"))
    .catch(err => console.error("❌ Error Service Worker:", err));
}




