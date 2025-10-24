/****************  FIREBASE  ****************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, setDoc, doc, getDoc, getDocs,
  deleteDoc, query, orderBy, limit, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ⚠️ TU CONFIG REAL */
const firebaseConfig = {
  apiKey: "AIzaSyB7eE1ZOWzcVXQTQ9y5suJ5FSkFWMZrTuE",
  authDomain: "control-partes-v2.firebaseapp.com",
  projectId: "control-partes-v2",
  storageBucket: "control-partes-v2.firebasestorage.app",
  messagingSenderId: "947187978310",
  appId: "1:947187978310:web:6b5507c430b5f221173a47"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/****************  UI REFS  ****************/
const loginSection = document.getElementById("login-section");
const formSection  = document.getElementById("form-section");
const adminSection = document.getElementById("admin-section");

const usuarioSel  = document.getElementById("usuario");
const legajoInput = document.getElementById("legajo");
const btnLogin    = document.getElementById("btnLogin");
const errorLogin  = document.getElementById("errorLogin");
const msgNoUsers  = document.getElementById("msgNoUsers");

const btnSalir      = document.getElementById("btnSalir");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");

const userActive  = document.getElementById("userActive");
const fechaInput  = document.getElementById("fecha");
const internoSel  = document.getElementById("interno");
const finalInput  = document.getElementById("final");
const cargoSel    = document.getElementById("cargoCombustible");
const datosComb   = document.getElementById("datosCombustible");
const litrosInput = document.getElementById("litros");
const kmCarga     = document.getElementById("kmCarga");
const novedades   = document.getElementById("novedades");
const btnGuardar  = document.getElementById("btnGuardar");
const msgGuardado = document.getElementById("msgGuardado");
const chipEstado  = document.getElementById("estadoServiceChip");

// Último parte (operario)
const ultimoParteBox = document.getElementById("ultimoParte");
const uFecha = document.getElementById("uFecha");
const uFinal = document.getElementById("uFinal");
const uComb  = document.getElementById("uCombustible");
const uNove  = document.getElementById("uNovedades");

// Tabs
const tabBtns       = document.querySelectorAll(".tab-btn");
const tablaUltimos  = document.querySelector("#tablaUltimos tbody");
const tablaUsuarios = document.querySelector("#tablaUsuarios tbody");
const tablaInternos = document.querySelector("#tablaInternos tbody");
const tablaPartes   = document.querySelector("#tablaPartes tbody");
const tablaService  = document.querySelector("#tablaService tbody");
const listaSinPartes= document.getElementById("listaSinPartes");

// Admin: Usuarios
const nuNombre      = document.getElementById("nu-nombre");
const nuLegajo      = document.getElementById("nu-legajo");
const nuRol         = document.getElementById("nu-rol");
const btnAddUsuario = document.getElementById("btnAddUsuario");

// Admin: Internos
const niCodigo  = document.getElementById("ni-codigo");
const niTipo    = document.getElementById("ni-tipo");
const niCada    = document.getElementById("ni-cada");
const niUltVal  = document.getElementById("ni-ultvalor");
const niUltFec  = document.getElementById("ni-ultfecha");
const niFAceite = document.getElementById("ni-f-aceite");
const niFAire   = document.getElementById("ni-f-aire");
const niFComb   = document.getElementById("ni-f-comb");
const niRM      = document.getElementById("ni-rm");
const btnAddInterno = document.getElementById("btnAddInterno");

// Admin: Service (solo tipo, dinámicos)
const svInterno = document.getElementById("sv-interno");
const svFecha   = document.getElementById("sv-fecha");
const svValor   = document.getElementById("sv-valor");
const btnAddService = document.getElementById("btnAddService");
const svAceiteTipo   = document.getElementById("sv-aceite-tipo");
const svAceiteLitros = document.getElementById("sv-aceite-litros");
const svRM           = document.getElementById("sv-rm");

// Listas dinámicas (solo tipo)
const SVC = {
  aceite: { list: document.getElementById("sv-list-aceite"), add: document.getElementById("sv-add-aceite"), label: "Aceite" },
  airep:  { list: document.getElementById("sv-list-airep"),  add: document.getElementById("sv-add-airep"),  label: "Aire P" },
  aires:  { list: document.getElementById("sv-list-aires"),  add: document.getElementById("sv-add-aires"),  label: "Aire S" },
  comb:   { list: document.getElementById("sv-list-comb"),   add: document.getElementById("sv-add-comb"),   label: "Comb."  },
  hab:    { list: document.getElementById("sv-list-hab"),    add: document.getElementById("sv-add-hab"),    label: "Habit." },
  hid:    { list: document.getElementById("sv-list-hid"),    add: document.getElementById("sv-add-hid"),    label: "Hidr."  },
};
const svSummary = document.getElementById("sv-summary");

// Dashboard metrics
const mActivos = document.getElementById("mActivos");
const mProx    = document.getElementById("mProx");
const mUltimo  = document.getElementById("mUltimo");

/****************  STATE & HELPERS  ****************/
let usuarioActivo = null; // {id, nombre, legajo, rol}
const today = () => new Date().toISOString().slice(0,10);

function badgeEstado(dif, cada, tipo) {
  const unidad = (tipo === "km") ? "km" : "hs";
  const restante = Math.max(0, cada - dif);
  if (dif >= cada)  return `<span class="badge danger">VENCIDO hace ${dif - cada} ${unidad}</span>`;
  if (dif >= Math.floor(cada * 0.9)) return `<span class="badge warn">PRÓXIMO — faltan ${restante} ${unidad}</span>`;
  return `<span class="badge ok">OK — faltan ${restante} ${unidad}</span>`;
}
const chip = (el, type, text) => { if(!el) return; el.className = "badge " + (type||""); el.textContent = text; };
const toast = (el, type, text) => { if(!el) return; el.className = "msg " + (type||""); el.textContent = text; setTimeout(()=>{ el.className="msg"; el.textContent="" }, 3500); };

/****************  SEEDS (opcional)  ****************/
const ENABLE_SEEDS = true;
async function ensureSeeds(){
  if(!ENABLE_SEEDS) return;

  const cu = await getDocs(collection(db,"usuarios"));
  if (cu.empty){
    await addDoc(collection(db,"usuarios"), {nombre:"admin",              legajo:"000", rol:"admin"});
    await addDoc(collection(db,"usuarios"), {nombre:"Rodriguez Rodrigo",  legajo:"127", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Rodriguez Gabriel",  legajo:"125", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Acevedo Nelson",     legajo:"123", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Arias Federico",     legajo:"124", rol:"operario"});
  }

  const ci = await getDocs(collection(db,"internos"));
  if (ci.empty){
    const base = today();
    await setDoc(doc(db,"internos","TR-512"),{tipo:"horas", proximoCada:250,   ultimoServiceValor:300,    ultimoServiceFecha:base, filtros:{aceite:"F-AC-001", aire:"F-AI-100", combustible:"F-CO-200"}, rm:"RM-TR512"});
    await setDoc(doc(db,"internos","C-185"), {tipo:"km",    proximoCada:10000, ultimoServiceValor:84000,  ultimoServiceFecha:base, filtros:{aceite:"F-AC-011", aire:"F-AI-101", combustible:"F-CO-210"}, rm:"RM-C185"});
    await setDoc(doc(db,"internos","T-434"), {tipo:"km",    proximoCada:10000, ultimoServiceValor:100000, ultimoServiceFecha:base, filtros:{aceite:"F-AC-019", aire:"F-AI-115", combustible:"F-CO-240"}, rm:"RM-T434"});
    await setDoc(doc(db,"internos","C-111"), {tipo:"horas", proximoCada:250,   ultimoServiceValor:1200,   ultimoServiceFecha:base, filtros:{aceite:"F-AC-050", aire:"F-AI-120", combustible:"F-CO-260"}, rm:"RM-C111"});
  }
}

/****************  COMBOS  ****************/
async function cargarUsuariosCombo(){
  if (!usuarioSel) return;
  usuarioSel.innerHTML = `<option value="">-- Elegí tu nombre --</option>`;
  const snap = await getDocs(collection(db,"usuarios"));
  if (snap.empty) { if (msgNoUsers) msgNoUsers.hidden = false; return; }
  if (msgNoUsers) msgNoUsers.hidden = true;

  snap.forEach(d=>{
    const u = d.data();
    const opt = document.createElement("option");
    opt.value = JSON.stringify({id:d.id, ...u});
    opt.textContent = u.nombre;
    usuarioSel.appendChild(opt);
  });
}

async function cargarInternosCombo(){
  if (internoSel){
    internoSel.innerHTML = `<option value="">-- Seleccioná un interno --</option>`;
  }
  if (svInterno){
    svInterno.innerHTML  = `<option value="">-- Seleccioná un interno --</option>`;
  }
  const snap = await getDocs(collection(db,"internos"));
  snap.forEach(d=>{
    if (internoSel){
      const opt = document.createElement("option");
      opt.value = d.id; opt.textContent = d.id;
      internoSel.appendChild(opt);
    }
    if (svInterno){
      const opt2 = document.createElement("option");
      opt2.value = d.id; opt2.textContent = d.id;
      svInterno.appendChild(opt2);
    }
  });
}

/****************  LOGIN  ****************/
btnLogin?.addEventListener("click", async ()=>{
  if (!usuarioSel || !legajoInput) return;
  errorLogin.textContent = "";
  if(!usuarioSel.value || !legajoInput.value){
    errorLogin.textContent = "Elegí un usuario y cargá el legajo."; return;
  }
  const u = JSON.parse(usuarioSel.value);
  if (u.legajo !== legajoInput.value){
    errorLogin.textContent = "Legajo incorrecto."; return;
  }
  usuarioActivo = u;
  localStorage.setItem("usuarioActivo", JSON.stringify(u));

  if (u.rol === "admin"){
    loginSection?.classList.add("hidden");
    adminSection?.classList.remove("hidden");
    btnSalirAdmin?.classList.remove("hidden");
    await initAdmin();
  } else {
    loginSection?.classList.add("hidden");
    formSection?.classList.remove("hidden");
    if (userActive) userActive.textContent = `Usuario: ${u.nombre}`;
    if (fechaInput) fechaInput.value = today();
    btnSalir?.classList.remove("hidden");
    await cargarInternosCombo();
  }
});
btnSalir?.addEventListener("click", ()=>{ localStorage.removeItem("usuarioActivo"); location.reload(); });
btnSalirAdmin?.addEventListener("click", ()=>{ localStorage.removeItem("usuarioActivo"); location.reload(); });

/****************  OPERARIO  ****************/
cargoSel?.addEventListener("change", ()=> datosComb?.classList.toggle("hidden", cargoSel.value!=="si"));

internoSel?.addEventListener("change", async ()=>{
  if (!internoSel) return;
  const interno = internoSel.value;
  if(!interno){
    ultimoParteBox?.classList.add("hidden");
    chip(chipEstado,"","—");
    return;
  }

  // último parte del interno
  const qs = query(collection(db,"partes"),
    where("interno","==", interno),
    orderBy("timestamp","desc"),
    limit(1)
  );
  const s = await getDocs(qs);
  if (s.empty){
    ultimoParteBox?.classList.remove("hidden");
    if (uFecha) uFecha.textContent="-";
    if (uFinal) uFinal.textContent="-";
    if (uComb)  uComb.textContent="-";
    if (uNove)  uNove.textContent="-";
    chip(chipEstado, "", "Sin historial aún");
    return;
  }
  const p = s.docs[0].data();
  ultimoParteBox?.classList.remove("hidden");
  if (uFecha) uFecha.textContent = p.fecha;
  if (uFinal) uFinal.textContent = p.final;
  if (uComb)  uComb.textContent  = p.combustible||"-";
  if (uNove)  uNove.textContent  = p.novedades||"-";

  // Estado de service respecto a "internos"
  const Iref = await getDoc(doc(db,"internos", interno));
  if (!Iref.exists()) { chip(chipEstado,"","—"); return; }
  const I = Iref.data();
  const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
  const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
  const unidad = (I?.tipo==="km") ? "km" : "hs";

  if (dif >= cada) chip(chipEstado,"danger",`VENCIDO hace ${dif - cada} ${unidad}`);
  else if (dif >= Math.floor(cada*0.9)) chip(chipEstado,"warn",`PRÓXIMO — faltan ${cada-dif} ${unidad}`);
  else chip(chipEstado,"ok",`OK — faltan ${cada-dif} ${unidad}`);
});

btnGuardar?.addEventListener("click", async ()=>{
  if(!usuarioActivo){ toast(msgGuardado,"err","Iniciá sesión primero."); return; }
  if(!fechaInput?.value || !internoSel?.value || !finalInput?.value){
    toast(msgGuardado,"err","Completá fecha, interno y final."); return;
  }

  const internoId = internoSel.value;
  const Idoc = await getDoc(doc(db,"internos", internoId));
  if(!Idoc.exists()){ toast(msgGuardado,"err","Interno no encontrado."); return; }
  const I = Idoc.data();

  const finalNum = Number(finalInput.value);
  const dif  = finalNum - Number(I.ultimoServiceValor || 0);
  const cada = Number(I.proximoCada || (I.tipo==="horas"?250:10000));

  let estadoService = "OK", cls = "ok";
  if (dif >= cada){ estadoService = "VENCIDO"; cls="err"; }
  else if (dif >= Math.floor(cada*0.9)){ estadoService = "PRÓXIMO"; cls="warn"; }

  await addDoc(collection(db,"partes"),{
    fecha: fechaInput.value,
    usuario: usuarioActivo.nombre,
    interno: internoId,
    final: finalNum,
    combustible: cargoSel.value==="si" ? `${litrosInput.value||0} L — ${kmCarga.value||0} km` : "No cargó combustible",
    novedades: novedades.value || "",
    estadoService,
    avanceDesdeService: dif,
    tipo: I.tipo,
    timestamp: serverTimestamp()
  });

  const unidad = (I.tipo==="km")? "km" : "hs";
  toast(msgGuardado, cls, `Parte guardado — Service: ${estadoService} (${dif}/${cada} ${unidad})`);

  // limpiar
  if (finalInput) finalInput.value="";
  if (novedades)  novedades.value="";
  if (litrosInput) litrosInput.value="";
  if (kmCarga)     kmCarga.value="";
  if (cargoSel)    cargoSel.value="no";
  datosComb?.classList.add("hidden");
});

/****************  ADMIN: Tabs  ****************/
tabBtns?.forEach(b=>{
  b.addEventListener("click", ()=>{
    tabBtns.forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"));
    const target = document.getElementById(`tab-${b.dataset.tab}`);
    target?.classList.remove("hidden");

    if (b.dataset.tab === "service") initServiceLists(); // asegurar filas iniciales
  });
});

/****************  ADMIN: Init  ****************/
async function initAdmin(){
  await cargarInternosCombo();
  await renderUsuarios();
  await renderInternos();
  await renderUltimos();
  await renderPartes();
  await renderServiceTabla();
  await renderSinPartes();
  await renderDashboardMetrics();
}

/***************  ADMIN: Usuarios  ****************/
btnAddUsuario?.addEventListener("click", async ()=>{
  const n = nuNombre?.value.trim(), l = nuLegajo?.value.trim(), r = nuRol?.value || "operario";
  if(!n || !l){ alert("Completá nombre y legajo."); return; }
  await addDoc(collection(db,"usuarios"), {nombre:n, legajo:l, rol:r});
  if (nuNombre) nuNombre.value="";
  if (nuLegajo) nuLegajo.value="";
  await renderUsuarios();
  await cargarUsuariosCombo();
});

async function renderUsuarios(){
  if(!tablaUsuarios) return;
  tablaUsuarios.innerHTML = "";
  const s = await getDocs(collection(db,"usuarios"));
  s.forEach(d=>{
    const u = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.nombre}</td>
      <td>${u.legajo}</td>
      <td>${u.rol}</td>
      <td><button class="btn small" data-del="${d.id}">Eliminar</button></td>`;
    tablaUsuarios.appendChild(tr);
  });
  tablaUsuarios.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar usuario?")) return;
      await deleteDoc(doc(db,"usuarios", b.dataset.del));
      await renderUsuarios();
      await cargarUsuariosCombo();
    });
  });
}

/***************  ADMIN: Internos  ****************/
btnAddInterno?.addEventListener("click", async ()=>{
  const cod = niCodigo?.value.trim();
  if(!cod){ alert("Ingresá código de interno"); return; }
  const data = {
    tipo: niTipo?.value || "horas",
    proximoCada: Number(niCada?.value || (niTipo?.value==="km"?10000:250)),
    ultimoServiceValor: Number(niUltVal?.value || 0),
    ultimoServiceFecha: niUltFec?.value || today(),
    filtros:{
      aceite: niFAceite?.value || "",
      aire:   niFAire?.value   || "",
      combustible: niFComb?.value || ""
    },
    rm: niRM?.value || ""
  };
  await setDoc(doc(db,"internos", cod), data);

  // limpiar
  if (niCodigo) niCodigo.value="";
  if (niCada)   niCada.value="";
  if (niUltVal) niUltVal.value="";
  if (niUltFec) niUltFec.value="";
  if (niFAceite)niFAceite.value="";
  if (niFAire)  niFAire.value="";
  if (niFComb)  niFComb.value="";
  if (niRM)     niRM.value="";

  await renderInternos();
  await cargarInternosCombo();
});

async function renderInternos(){
  if(!tablaInternos) return;
  tablaInternos.innerHTML = "";
  const s = await getDocs(collection(db,"internos"));
  if (mActivos) mActivos.textContent = s.size;

  s.forEach(d=>{
    const i = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${d.id}</b></td>
      <td>${i.tipo}</td>
      <td>${i.proximoCada}</td>
      <td>${i.ultimoServiceValor} (${i.ultimoServiceFecha})</td>
      <td>Aceite: ${i.filtros?.aceite||"-"} · Aire: ${i.filtros?.aire||"-"} · Comb.: ${i.filtros?.combustible||"-"}</td>
      <td>${i.rm||"-"}</td>
      <td><button class="btn small" data-del="${d.id}">Eliminar</button></td>`;
    tablaInternos.appendChild(tr);
  });

  tablaInternos.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar interno? (No borra partes)")) return;
      await deleteDoc(doc(db,"internos", b.dataset.del));
      await renderInternos();
      await cargarInternosCombo();
    });
  });
}

/***************  ADMIN: Partes  ****************/
async function renderUltimos(){
  if(!tablaUltimos) return;
  tablaUltimos.innerHTML="";
  const qs = query(collection(db,"partes"), orderBy("timestamp","desc"), limit(5));
  const s = await getDocs(qs);
  for (const d of s.docs){
    const p = d.data();
    const I = (await getDoc(doc(db,"internos", p.interno))).data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    const tipo = I?.tipo || "horas";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.fecha}</td>
      <td>${p.usuario}</td>
      <td>${p.interno}</td>
      <td>${p.final}</td>
      <td>${badgeEstado(dif,cada,tipo)}</td>`;
    tablaUltimos.appendChild(tr);
  }
  if (mUltimo && s.size>0) mUltimo.textContent = s.docs[0].data().fecha;
}

async function renderPartes(){
  if(!tablaPartes) return;
  tablaPartes.innerHTML="";
  const qs = query(collection(db,"partes"), orderBy("timestamp","desc"));
  const s = await getDocs(qs);

  for(const d of s.docs){
    const p = d.data();
    const I = (await getDoc(doc(db,"internos", p.interno))).data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    const tipo = I?.tipo || "horas";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.fecha}</td>
      <td>${p.usuario}</td>
      <td>${p.interno}</td>
      <td>${p.final}</td>
      <td>${p.combustible||"-"}</td>
      <td>${p.novedades||"-"}</td>
      <td>${badgeEstado(dif,cada,tipo)}</td>
      <td><button class="btn small" data-del="${d.id}">Eliminar</button></td>`;
    tablaPartes.appendChild(tr);
  }

  tablaPartes.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar parte?")) return;
      await deleteDoc(doc(db,"partes", b.dataset.del));
      await renderPartes();
      await renderUltimos();
      await renderSinPartes();
    });
  });
}

/***************  SERVICE (solo tipo + resumen en vivo)  ****************/
/* UI helpers */
function createFilterRow() {
  const row = document.createElement("div");
  row.className = "filter-row";
  row.innerHTML = `
    <input class="input" type="text" placeholder="Tipo (ej: Fleetguard LF608)" />
    <button type="button" class="btn-icon danger" title="Quitar" aria-label="Quitar fila">×</button>
  `;
  row.querySelector(".btn-icon").addEventListener("click", () => {
    row.remove(); updateServiceSummary();
  });
  return row;
}
function ensureOneRow(listEl){ if(!listEl) return; if(listEl.querySelectorAll(".filter-row").length===0) listEl.appendChild(createFilterRow()); }
function collectTypes(listEl){
  if (!listEl) return [];
  return [...listEl.querySelectorAll(".filter-row input")].map(i => (i.value||"").trim()).filter(Boolean);
}
function clearList(listEl){ if(!listEl) return; listEl.innerHTML = ""; ensureOneRow(listEl); }

/* Wire + buttons */
Object.values(SVC).forEach(g=>{
  if (g.add && g.list){
    g.add.addEventListener("click", ()=>{ g.list.appendChild(createFilterRow()); updateServiceSummary(); });
  }
});

/* Initial rows when tab opens */
function initServiceLists(){
  Object.values(SVC).forEach(g=> ensureOneRow(g.list));
  updateServiceSummary();
}

/* Resumen en vivo (contadores por tipo) */
function updateServiceSummary(){
  if (!svSummary) return;
  const counts = {
    Aceite:        collectTypes(SVC.aceite.list).length,
    "Aire P":      collectTypes(SVC.airep.list).length,
    "Aire S":      collectTypes(SVC.aires.list).length,
    "Comb.":       collectTypes(SVC.comb.list).length,
    "Habit.":      collectTypes(SVC.hab.list).length,
    "Hidr.":       collectTypes(SVC.hid.list).length,
  };
  const tags = Object.entries(counts).filter(([,n])=>n>0).map(([k,n])=>`<span class="tag">${k} (${n})</span>`).join(" ");
  svSummary.innerHTML = tags || `<span class="muted">Agregá filtros para ver el resumen…</span>`;
}
document.addEventListener("input", (e)=>{
  if (e.target.closest(".sv-list")) updateServiceSummary();
});

/* Guardar service */
btnAddService?.addEventListener("click", async ()=>{
  if(!svInterno?.value || !svFecha?.value || !svValor?.value){
    alert("Completá interno, fecha y valor."); return;
  }
  const internoId = svInterno.value;
  const val = Number(svValor.value);
  const I = (await getDoc(doc(db,"internos", internoId))).data() || {};

  // Leer arrays de tipos
  const filtros = {
    aceite:        collectTypes(SVC.aceite.list),
    airePrimario:  collectTypes(SVC.airep.list),
    aireSecundario:collectTypes(SVC.aires.list),
    combustible:   collectTypes(SVC.comb.list),
    habitaculo:    collectTypes(SVC.hab.list),
    hidraulico:    collectTypes(SVC.hid.list),
  };
  const aceiteUsado = {
    tipo:   (svAceiteTipo?.value || "").trim(),
    litros: Number(svAceiteLitros?.value || 0),
  };
  const rmTxt = (svRM?.value || "").trim();

  await addDoc(collection(db,"services"),{
    interno: internoId,
    fecha: svFecha.value,
    valorService: val,
    tipo: I?.tipo || "horas",
    filtros,        // arrays de tipos
    aceite: aceiteUsado,
    rm: rmTxt,
    notas: "Service registrado",
    timestamp: serverTimestamp()
  });

  // Actualiza último service del interno (y RM si viene)
  await setDoc(doc(db,"internos", internoId), {
    ...I,
    ultimoServiceValor: val,
    ultimoServiceFecha: svFecha.value,
    ...(rmTxt ? { rm: rmTxt } : {}),
  });

  // limpiar UI
  svValor.value = "";
  if (svAceiteTipo)   svAceiteTipo.value="";
  if (svAceiteLitros) svAceiteLitros.value="";
  if (svRM)           svRM.value="";

  Object.values(SVC).forEach(g => clearList(g.list));
  updateServiceSummary();

  await renderInternos();
  await renderPartes();
  await renderUltimos();
  await renderServiceTabla();
});

/* Tabla de services con resumen (contadores) */
function resumenTipos(f){
  if(!f) return "-";
  const c = [
    f.aceite?.length ? `Aceite: ${f.aceite.length}` : "",
    f.airePrimario?.length ? `Aire P: ${f.airePrimario.length}` : "",
    f.aireSecundario?.length ? `Aire S: ${f.aireSecundario.length}` : "",
    f.combustible?.length ? `Comb.: ${f.combustible.length}` : "",
    f.habitaculo?.length ? `Habit.: ${f.habitaculo.length}` : "",
    f.hidraulico?.length ? `Hidr.: ${f.hidraulico.length}` : "",
  ].filter(Boolean);
  return c.length ? c.join(" · ") : "-";
}
async function renderServiceTabla(){
  if(!tablaService) return;
  tablaService.innerHTML="";
  const qs = query(collection(db,"services"), orderBy("timestamp","desc"), limit(50));
  const s = await getDocs(qs);
  s.forEach(d=>{
    const x = d.data();
    const aceiteTxt = (x.aceite && (x.aceite.tipo || x.aceite.litros))
      ? `${x.aceite.tipo||""}${x.aceite.tipo && x.aceite.litros ? " – " : ""}${x.aceite.litros? (x.aceite.litros+" L"):""}`
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${x.fecha}</td>
      <td>${x.interno}</td>
      <td>${x.valorService}</td>
      <td>${x.tipo}</td>
      <td>${resumenTipos(x.filtros)}</td>
      <td>${aceiteTxt}</td>
      <td>${x.rm||"-"}</td>`;
    tablaService.appendChild(tr);
  });
}

/***************  Equipos sin partes ≥ 5 días  ****************/
async function renderSinPartes(){
  if(!listaSinPartes) return;
  listaSinPartes.innerHTML="";
  const ints = await getDocs(collection(db,"internos"));
  const cinco = 5*24*60*60*1000, now = Date.now();

  for(const i of ints.docs){
    const interno = i.id;
    const qs = query(collection(db,"partes"), where("interno","==", interno), orderBy("timestamp","desc"), limit(1));
    const s = await getDocs(qs);
    if (s.empty){
      listaSinPartes.insertAdjacentHTML("beforeend", `<li><b>${interno}</b> — <i>sin partes recientes</i></li>`);
      continue;
    }
    const ts = s.docs[0].data().timestamp?.toMillis?.() || Date.parse(s.docs[0].data().fecha);
    if (!ts || (now - ts) >= cinco){
      const days = Math.floor((now - ts)/(24*60*60*1000));
      listaSinPartes.insertAdjacentHTML("beforeend", `<li><b>${interno}</b> — <i>sin partes hace ${days} días</i></li>`);
    }
  }
}

/***************  Métricas  ****************/
async function renderDashboardMetrics(){
  // Activos se setea en renderInternos
  let proximos = 0;
  const ints = await getDocs(collection(db,"internos"));
  for(const i of ints.docs){
    const I = i.data();
    const qs = query(collection(db,"partes"), where("interno","==", i.id), orderBy("timestamp","desc"), limit(1));
    const s = await getDocs(qs);
    if (s.empty) continue;
    const p = s.docs[0].data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    if (dif >= Math.floor(cada*0.9)) proximos++;
  }
  if (mProx) mProx.textContent = proximos;
}

/****************  BOOT  ****************/
(async function boot(){
  await ensureSeeds();
  await cargarUsuariosCombo();
  if (fechaInput) fechaInput.value = today();

  const saved = localStorage.getItem("usuarioActivo");
  if (saved){
    const u = JSON.parse(saved);
    if (usuarioSel) usuarioSel.value = JSON.stringify(u);
    if (legajoInput) legajoInput.value = u.legajo;
    btnLogin?.click();
  }
})();
