
const DEPARTMENTS = ["Baromètres","Construct","Coordination","Finance","IT","Legal","Marketing","Ops","Ops Exc.","Qualité","Real Estate","RH","Supply","Technique","Training"];

function WeeklyView({ currentUser }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newDept, setNewDept] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await sb(`weekly_notes?select=*&consultant_id=eq.${currentUser.id}&order=created_at.desc`);
      if (data) setNotes(data);
      setLoading(false);
    };
    load();
  }, []);

  const addNote = async () => {
    if (!newText.trim()) return;
    setSaving(true);
    const note = { id: Date.now().toString(), consultant_id: currentUser.id, consultant_name: currentUser.name, department: newDept || null, text: newText.trim(), created_at: new Date().toISOString() };
    const res = await sb("weekly_notes", { method: "POST", body: JSON.stringify(note) });
    if (res) setNotes(prev => [note, ...prev]);
    setNewText("");
    setNewDept("");
    setSaving(false);
  };

  const deleteNote = async (id) => {
    await sb(`weekly_notes?id=eq.${id}`, { method: "DELETE", prefer: "" });
    setNotes(prev => prev.filter(n => n.id !== id));
    setDeleteConfirm(null);
  };

  // Group by department
  const grouped = {};
  const noDept = [];
  notes.forEach(n => {
    if (n.department) {
      if (!grouped[n.department]) grouped[n.department] = [];
      grouped[n.department].push(n);
    } else {
      noDept.push(n);
    }
  });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">📋 Weekly</div>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{notes.length} note{notes.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Add note form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">Département (optionnel)</label>
            <select className="form-select" value={newDept} onChange={e => setNewDept(e.target.value)}>
              <option value="">Sans département</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label className="form-label">Note</label>
            <textarea className="form-textarea" placeholder="Ajouter une note pour la réunion hebdomadaire..." value={newText} onChange={e => setNewText(e.target.value)} rows={3} />
          </div>
          <button className="btn-primary" onClick={addNote} disabled={saving || !newText.trim()}>
            {saving ? "Ajout..." : "+ Ajouter la note"}
          </button>
        </div>
      </div>

      {loading && <div className="empty"><div className="empty-text">Chargement...</div></div>}
      {!loading && notes.length === 0 && <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune note pour le moment</div></div>}

      {/* Notes sans département */}
      {noDept.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Général</div>
          {noDept.map(n => (
            <div key={n.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 18px", gap: 8 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>{n.text}</p>
                <button className="btn-icon" onClick={() => setDeleteConfirm(n)}><Icon name="trash" size={14} color="#E53935" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notes par département */}
      {Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([dept, deptNotes]) => (
        <div key={dept} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #eee" }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, color: "#E30613" }}>{dept}</div>
            <span style={{ fontSize: 12, color: "#999" }}>{deptNotes.length} note{deptNotes.length > 1 ? "s" : ""}</span>
          </div>
          {deptNotes.map(n => (
            <div key={n.id} className="card" style={{ marginBottom: 8, borderLeft: "4px solid #E30613" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 18px", gap: 8 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, flex: 1 }}>{n.text}</p>
                <button className="btn-icon" onClick={() => setDeleteConfirm(n)}><Icon name="trash" size={14} color="#E53935" /></button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 340 }}>
            <div className="modal-title" style={{ fontSize: 18 }}>🗑️ Supprimer cette note ?</div>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>Cette suppression est <strong>irréversible</strong>.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1, background: "#E53935" }} onClick={() => deleteNote(deleteConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VisitDetail({ visit, actions, restaurant, onBack, onEdit, onDelete, onNewAction, onEditAction, onDeleteAction, onUpdateStatus }) {
  const cats = Object.entries(visit.categories || {}).filter(([, v]) => v);
  const visitActions = actions.filter(a => a.visitId === visit.id);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const generatePdf = () => {
    setGeneratingPdf(true);
    const dateStr = new Date(visit.date).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const statusLabels = { open: "Ouvert", inprogress: "En cours", resolved: "Résolu" };

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1a1a1a; font-size: 13px; }
  .header { background: #E30613; color: white; padding: 28px 32px; }
  .header-logo { font-size: 36px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
  .header-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .header-meta { font-size: 13px; opacity: 0.85; }
  .content { padding: 24px 32px; }
  .section { margin-bottom: 18px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
  .section-header { background: #f5f5f5; padding: 10px 16px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #E30613; }
  .section-body { padding: 12px 16px; font-size: 13px; line-height: 1.7; color: #333; }
  .actions-title { font-weight: 800; font-size: 14px; text-transform: uppercase; color: #666; margin: 20px 0 10px; letter-spacing: 0.5px; }
  .action-item { border: 1px solid #eee; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; border-left: 4px solid #ccc; }
  .action-item.open { border-left-color: #E53935; }
  .action-item.inprogress { border-left-color: #F57C00; }
  .action-item.resolved { border-left-color: #2E7D32; }
  .action-text { font-size: 13px; margin-bottom: 4px; }
  .action-meta { font-size: 11px; color: #999; }
  .status { font-weight: 700; }
  .status.open { color: #E53935; }
  .status.inprogress { color: #F57C00; }
  .status.resolved { color: #2E7D32; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #999; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div class="header-logo">Q ops</div>
  <div class="header-title">${restaurant?.name || "Restaurant"}</div>
  <div class="header-meta">${dateStr} &nbsp;·&nbsp; ${visit.consultantName} &nbsp;·&nbsp; ${restaurant?.town || ""}</div>
</div>
<div class="content">
  <div style="font-size:11px;color:#999;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.8px;">Rapport de visite — ${cats.length} catégorie${cats.length !== 1 ? "s" : ""} renseignée${cats.length !== 1 ? "s" : ""}</div>
  ${cats.map(([cat, text]) => `
    <div class="section">
      <div class="section-header">${cat}</div>
      <div class="section-body">${text.replace(/\n/g, "<br>")}</div>
    </div>
  `).join("")}
  ${visitActions.length > 0 ? `
    <div class="actions-title">Plans d'action (${visitActions.length})</div>
    ${visitActions.map(a => `
      <div class="action-item ${a.status}">
        <div class="action-text">${a.text}</div>
        <div class="action-meta">
          <span class="status ${a.status}">${statusLabels[a.status] || a.status}</span>
          ${a.category ? ` &nbsp;·&nbsp; ${a.category}` : ""}
        </div>
      </div>
    `).join("")}
  ` : ""}
  <div class="footer">
    <span>Q ops — Suivi des visites Quick</span>
    <span>Généré le ${new Date().toLocaleDateString("fr-BE")}</span>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visite-${restaurant?.name?.replace(/ /g, "-") || "restaurant"}-${visit.date}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setGeneratingPdf(false);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <button className="page-back" onClick={onBack}><Icon name="back" size={16} />Retour aux visites</button>
          <div className="page-title" style={{ marginTop: 4 }}>{new Date(visit.date).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>Par {visit.consultantName}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn-secondary" onClick={generatePdf} style={{ fontSize: 12, padding: "8px 12px" }}>
            {generatingPdf ? "..." : "⬇️ PDF"}
          </button>
          <button className="btn-icon" onClick={onEdit}><Icon name="edit" size={16} /></button>
          <button className="btn-icon" onClick={onDelete}><Icon name="trash" size={16} color="#E53935" /></button>
        </div>
      </div>
      {cats.length === 0 && <div className="empty"><div className="empty-text">Aucune note dans cette visite</div></div>}
      {cats.map(([cat, text]) => (
        <div key={cat} className="card" style={{ marginBottom: 10 }}>
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="category-dot" /><span className="card-title">{cat}</span></div>
          </div>
          <div className="card-body"><p style={{ fontSize: 14, lineHeight: 1.6 }}>{text}</p></div>
        </div>
      ))}
      {visitActions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase", marginBottom: 10, color: "#666" }}>Actions de cette visite</div>
          {visitActions.map(a => <ActionItem key={a.id} action={a} onUpdateStatus={onUpdateStatus} onEdit={onEditAction} onDelete={onDeleteAction} />)}
        </div>
      )}
    </div>
  );
}

function AdminView({ restaurants, setRestaurants, users }) {
  const [search, setSearch] = useState("");
  const [editingRest, setEditingRest] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ id: "", name: "", address: "", zip: "", town: "", country: "Belgium", phone: "", manager: "", typology: "", contractType: "", language: "FR", franchisee: "", franchiseeEmail: "", franchiseePhone: "", companyName: "" });
  const [saving, setSaving] = useState(false);
  const [deleteRestConfirm, setDeleteRestConfirm] = useState(null);

  const filtered = restaurants.filter(r => {
    const q = search.toLowerCase();
    return !q || r.name?.toLowerCase().includes(q) || r.town?.toLowerCase().includes(q) || r.manager?.toLowerCase().includes(q);
  }).sort((a,b) => a.name?.localeCompare(b.name));

  const consultants = users.filter(u => u.id !== "admin").map(u => u.name);

  const startEdit = (r) => { setEditingRest(r.id); setEditForm({ ...r }); };

  const saveEdit = async () => {
    setSaving(true);
    const payload = {
      name: editForm.name, address: editForm.address, zip: editForm.zip, town: editForm.town,
      country: editForm.country, phone: editForm.phone, manager: editForm.manager,
      typology: editForm.typology, contract_type: editForm.contractType, language: editForm.language,
      franchisee: editForm.franchisee, franchisee_email: editForm.franchiseeEmail,
      franchisee_phone: editForm.franchiseePhone, company_name: editForm.companyName
    };
    await sb(`restaurants?id=eq.${editForm.id}`, { method: "PATCH", body: JSON.stringify(payload) });
    setRestaurants(prev => prev.map(r => r.id === editForm.id ? { ...r, ...editForm } : r));
    setEditingRest(null);
    setSaving(false);
  };

  const saveAdd = async () => {
    if (!addForm.id || !addForm.name) return;
    setSaving(true);
    const payload = { id: addForm.id, name: addForm.name, address: addForm.address, zip: addForm.zip, town: addForm.town, country: addForm.country, phone: addForm.phone, manager: addForm.manager, typology: addForm.typology, contract_type: addForm.contractType, language: addForm.language, franchisee: addForm.franchisee, franchisee_email: addForm.franchiseeEmail, franchisee_phone: addForm.franchiseePhone, company_name: addForm.companyName };
    await db.restaurants.upsert(payload);
    setRestaurants(prev => [...prev, { ...addForm, contractType: addForm.contractType, franchiseeEmail: addForm.franchiseeEmail, franchiseePhone: addForm.franchiseePhone, companyName: addForm.companyName }]);
    setShowAddForm(false);
    setAddForm({ id: "", name: "", address: "", zip: "", town: "", country: "Belgium", phone: "", manager: "", typology: "", contractType: "", language: "FR", franchisee: "", franchiseeEmail: "", franchiseePhone: "", companyName: "" });
    setSaving(false);
  };

  const deleteRest = async (id) => {
    setSaving(true);
    await sb(`restaurants?id=eq.${id}`, { method: "DELETE", prefer: "" });
    setRestaurants(prev => prev.filter(r => r.id !== id));
    setDeleteRestConfirm(null);
    setSaving(false);
  };

  const Field = ({ label, value, field, type = "text", options }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {options ? (
        <select className="form-select" value={value || ""} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} className="form-input" value={value || ""} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))} />
      )}
    </div>
  );

  const AddField = ({ label, field, options }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {options ? (
        <select className="form-select" value={addForm[field] || ""} onChange={e => setAddForm(prev => ({ ...prev, [field]: e.target.value }))}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input className="form-input" value={addForm[field] || ""} onChange={e => setAddForm(prev => ({ ...prev, [field]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">⚙️ Administration</div>
        <button className="btn-primary" style={{ width: "auto", padding: "10px 16px", fontSize: 14 }} onClick={() => setShowAddForm(true)}>
          <Icon name="plus" size={14} color="#fff" /> Nouveau restaurant
        </button>
      </div>

      <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        {restaurants.length} restaurants · Accessible uniquement à Gregory
      </div>

      <div className="search-wrap" style={{ marginBottom: 16 }}>
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input className="search-input" placeholder="Rechercher un restaurant..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.map(r => (
        <div key={r.id} className="card" style={{ marginBottom: 8 }}>
          {editingRest === r.id ? (
            <div className="card-body">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Modifier — {r.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Nom" value={editForm.name} field="name" />
                <Field label="ID" value={editForm.id} field="id" />
                <Field label="Adresse" value={editForm.address} field="address" />
                <Field label="Code postal" value={editForm.zip} field="zip" />
                <Field label="Ville" value={editForm.town} field="town" />
                <Field label="Pays" value={editForm.country} field="country" options={["Belgium","Luxembourg","France"]} />
                <Field label="Téléphone" value={editForm.phone} field="phone" />
                <Field label="Consultant" value={editForm.manager} field="manager" options={consultants} />
                <Field label="Typologie" value={editForm.typology} field="typology" options={["City Center","Mall","Retail Park","Periphery","Highway","Airport","Train / Bus station"]} />
                <Field label="Type de contrat" value={editForm.contractType} field="contractType" options={["Rental Management (LG)","Shared Franchise (FP)","Full Franchise (FT)","Owner (CY)"]} />
                <Field label="Langue" value={editForm.language} field="language" options={["FR","NL","BIL"]} />
                <Field label="Franchisé / Manager" value={editForm.franchisee} field="franchisee" />
                <Field label="Email franchisé" value={editForm.franchiseeEmail} field="franchiseeEmail" type="email" />
                <Field label="Tél franchisé" value={editForm.franchiseePhone} field="franchiseePhone" />
                <Field label="Nom société" value={editForm.companyName} field="companyName" />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setEditingRest(null)}>Annuler</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={saveEdit}>{saving ? "Sauvegarde..." : "Enregistrer"}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{r.town} · {r.manager} · {r.typology}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{r.franchisee}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button className="btn-icon" onClick={() => startEdit(r)}><Icon name="edit" size={15} /></button>
                <button className="btn-icon" onClick={() => setDeleteRestConfirm(r)}><Icon name="trash" size={15} color="#E53935" /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Nouveau restaurant</span>
              <button className="btn-icon" onClick={() => setShowAddForm(false)}><Icon name="close" size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <AddField label="ID *" field="id" />
              <AddField label="Nom *" field="name" />
              <AddField label="Adresse" field="address" />
              <AddField label="Code postal" field="zip" />
              <AddField label="Ville" field="town" />
              <AddField label="Pays" field="country" options={["Belgium","Luxembourg","France"]} />
              <AddField label="Téléphone" field="phone" />
              <AddField label="Consultant" field="manager" options={USERS.filter(u => u.id !== "admin").map(u => u.name)} />
              <AddField label="Typologie" field="typology" options={["City Center","Mall","Retail Park","Periphery","Highway","Airport","Train / Bus station"]} />
              <AddField label="Contrat" field="contractType" options={["Rental Management (LG)","Shared Franchise (FP)","Full Franchise (FT)","Owner (CY)"]} />
              <AddField label="Langue" field="language" options={["FR","NL","BIL"]} />
              <AddField label="Franchisé" field="franchisee" />
              <AddField label="Email franchisé" field="franchiseeEmail" />
              <AddField label="Tél franchisé" field="franchiseePhone" />
              <AddField label="Nom société" field="companyName" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowAddForm(false)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={saveAdd}>{saving ? "Sauvegarde..." : "Ajouter le restaurant"}</button>
            </div>
          </div>
        </div>
      )}

      
      {deleteRestConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-title" style={{ fontSize: 18 }}>🗑️ Supprimer ce restaurant ?</div>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 8 }}>
              <strong>{deleteRestConfirm.name}</strong> sera supprimé définitivement.
            </p>
            <p style={{ fontSize: 13, color: "#E53935", marginBottom: 20 }}>⚠️ Les visites et actions liées ne seront pas supprimées.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteRestConfirm(null)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1, background: "#E53935" }} onClick={() => deleteRest(deleteRestConfirm.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AllVisitsView({ visits, restaurants, onRestClick }) {
  const [searchQ, setSearchQ] = useState("");
  const [groupBy, setGroupBy] = useState("restaurant"); // "restaurant" | "consultant" | "date"

  const getRest = id => restaurants.find(r => r.id === id);

  const sorted = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = sorted.filter(v => {
    const q = searchQ.toLowerCase();
    if (!q) return true;
    const r = getRest(v.restaurantId);
    return r?.name?.toLowerCase().includes(q) || r?.town?.toLowerCase().includes(q) ||
      v.consultantName?.toLowerCase().includes(q) ||
      new Date(v.date).toLocaleDateString("fr-BE").includes(q) ||
      Object.values(v.categories || {}).some(c => c?.toLowerCase().includes(q));
  });

  const grouped = {};
  filtered.forEach(v => {
    let key;
    if (groupBy === "restaurant") { const r = getRest(v.restaurantId); key = r ? `${r.name}||${r.id}` : "Inconnu"; }
    else if (groupBy === "consultant") key = v.consultantName || "Inconnu";
    else { const d = new Date(v.date); key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}||${d.toLocaleDateString("fr-BE", { month: "long", year: "numeric" })}`; }
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });

  const sortedGroupKeys = Object.keys(grouped).sort((a, b) => groupBy === "date" ? b.localeCompare(a) : a.localeCompare(b));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">Toutes les visites</div>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{filtered.length} / {visits.length} affichée{filtered.length > 1 ? "s" : ""}</div>
      </div>

      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input className="search-input" placeholder="Rechercher par restaurant, consultant, date, note..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px" }}>Grouper par</span>
        {[["restaurant","Restaurant"],["consultant","Consultant"],["date","Mois"]].map(([k,l]) => (
          <span key={k} className={`filter-chip ${groupBy === k ? "active" : ""}`} onClick={() => setGroupBy(k)}>{l}</span>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune visite trouvée</div></div>}

      {sortedGroupKeys.map(key => {
        const items = grouped[key];
        let label, restId;
        if (groupBy === "restaurant") { const parts = key.split("||"); label = parts[0]; restId = parts[1]; }
        else if (groupBy === "date") { label = key.split("||")[1]; }
        else label = key;

        return (
          <div key={key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #eee" }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1a1a", textTransform: groupBy === "date" ? "capitalize" : "none" }}>{label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#999" }}>{items.length} visite{items.length > 1 ? "s" : ""}</span>
                {restId && <span style={{ fontSize: 12, color: "#E30613", fontWeight: 700, cursor: "pointer" }} onClick={() => onRestClick(restId)}>↗ Voir le restaurant</span>}
              </div>
            </div>
            {items.map(v => {
              const r = getRest(v.restaurantId);
              const cats = Object.entries(v.categories || {}).filter(([,val]) => val);
              return (
                <div key={v.id} className="visit-item" onClick={() => onRestClick(v.restaurantId)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="visit-date">{new Date(v.date).toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                      {groupBy !== "restaurant" && r && <div style={{ fontSize: 12, fontWeight: 700, color: "#E30613", marginTop: 2 }}>{r.name}</div>}
                      {groupBy !== "consultant" && <div className="visit-consultant">{v.consultantName}</div>}
                      {cats.length > 0 && <div className="visit-preview">{cats.map(([k]) => k).join(" · ")}</div>}
                    </div>
                    <span className="rest-badge">{cats.length} cat.</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ActionsView({ actions, restaurants, statusFilter, setStatusFilter, onUpdateStatus, onDelete, onEdit, onRestClick }) {
  const [searchQ, setSearchQ] = useState("");
  const [groupBy, setGroupBy] = useState("restaurant"); // "restaurant" | "status" | "category" | "consultant"

  const getRest = id => restaurants.find(r => r.id === id);

  const filtered = actions.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = searchQ.toLowerCase();
    const rest = getRest(a.restaurantId);
    const matchQ = !q || a.text?.toLowerCase().includes(q) || rest?.name?.toLowerCase().includes(q) || rest?.town?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q) || a.consultantName?.toLowerCase().includes(q);
    return matchStatus && matchQ;
  }).sort((a,b) => {
    const order = { open: 0, inprogress: 1, resolved: 2 };
    return order[a.status] - order[b.status] || new Date(b.createdAt) - new Date(a.createdAt);
  });

  const grouped = {};
  filtered.forEach(a => {
    let key;
    if (groupBy === "restaurant") { const r = getRest(a.restaurantId); key = r ? `${r.name}||${r.town}||${r.id}` : "Inconnu"; }
    else if (groupBy === "status") key = a.status;
    else if (groupBy === "consultant") key = a.consultantName || "Inconnu";
    else key = a.category || "Global";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const counts = { open: actions.filter(a => a.status === "open").length, inprogress: actions.filter(a => a.status === "inprogress").length, resolved: actions.filter(a => a.status === "resolved").length };

  return (
    <div>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">Plans d'action</div>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{filtered.length} / {actions.length} affiché{filtered.length > 1 ? "s" : ""}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {[["open","🔴"],["inprogress","🟡"],["resolved","🟢"]].map(([s, emoji]) => (
          <div key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)} style={{ background: statusFilter === s ? STATUS_CONFIG[s].bg : "#fff", border: `2px solid ${statusFilter === s ? STATUS_CONFIG[s].color : "#eee"}`, borderRadius: 12, padding: "10px 12px", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", color: STATUS_CONFIG[s].color }}>{counts[s]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_CONFIG[s].color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{emoji} {STATUS_CONFIG[s].label}</div>
          </div>
        ))}
      </div>

      <div className="search-wrap" style={{ marginBottom: 12 }}>
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input className="search-input" placeholder="Rechercher une action, restaurant, catégorie..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px" }}>Grouper par</span>
        {[["restaurant","Restaurant"],["consultant","Consultant"],["status","Statut"],["category","Catégorie"]].map(([k,l]) => (
          <span key={k} className={`filter-chip ${groupBy === k ? "active" : ""}`} onClick={() => setGroupBy(k)}>{l}</span>
        ))}
      </div>

      {filtered.length === 0 && <div className="empty"><div className="empty-icon"><Icon name="action" size={40} /></div><div className="empty-text">Aucune action trouvée</div></div>}

      {Object.entries(grouped).map(([key, items]) => {
        let label, sublabel, restId;
        if (groupBy === "restaurant") { const parts = key.split("||"); label = parts[0]; sublabel = parts[1]; restId = parts[2]; }
        else if (groupBy === "status") { label = STATUS_CONFIG[key]?.label || key; sublabel = `${items.length} action${items.length > 1 ? "s" : ""}`; }
        else if (groupBy === "consultant") { label = key; sublabel = `${items.length} action${items.length > 1 ? "s" : ""}`; }
        else { label = key; sublabel = `${items.length} action${items.length > 1 ? "s" : ""}`; }

        return (
          <div key={key} style={{ marginBottom: 20 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingBottom: 6, borderBottom: "2px solid #eee" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, color: "#1a1a1a" }}>{label}</div>
                {sublabel && groupBy === "restaurant" && <div style={{ fontSize: 12, color: "#999" }}>{sublabel}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#999" }}>{items.length} action{items.length > 1 ? "s" : ""}</span>
                {restId && <span style={{ fontSize: 12, color: "#E30613", fontWeight: 700, cursor: "pointer" }} onClick={() => onRestClick(restId)}>↗ Voir le restaurant</span>}
              </div>
            </div>

            {items.map(a => <ActionItem key={a.id} action={a} onUpdateStatus={onUpdateStatus} onEdit={onEdit} onDelete={onDelete} showRestaurant={groupBy !== "restaurant"} restaurant={getRest(a.restaurantId)} onRestClick={onRestClick} />)}
          </div>
        );
      })}
    </div>
  );
}

function ActionItem({ action, onUpdateStatus, onEdit, onDelete, showRestaurant, restaurant, onRestClick }) {
  const s = STATUS_CONFIG[action.status] || STATUS_CONFIG.open;
  return (
    <div className="action-item" style={{ borderLeftColor: s.color }}>
      {showRestaurant && restaurant && (
        <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6, cursor: "pointer" }} onClick={() => onRestClick(restaurant.id)}>
          {restaurant.name} — {restaurant.town} ↗
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div className="action-text" style={{ flex: 1 }}>{action.text}</div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button className="btn-icon" onClick={() => onEdit(action)}><Icon name="edit" size={14} /></button>
          <button className="btn-icon" onClick={() => onDelete(action.id)}><Icon name="trash" size={14} color="#E53935" /></button>
        </div>
      </div>
      <div className="action-meta" style={{ marginTop: 10 }}>

        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <button key={k} onClick={() => onUpdateStatus(action.id, k)} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${action.status === k ? v.color : "#ddd"}`, background: action.status === k ? v.bg : "#fff", color: action.status === k ? v.color : "#aaa", cursor: "pointer", transition: "all 0.15s" }}>
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
          {action.category && <span className="action-category">{action.category}</span>}
          <span className="action-date">{new Date(action.createdAt).toLocaleDateString("fr-BE")} · {action.consultantName}</span>
        </div>
      </div>
    </div>
  );
}

function VisitFormModal({ visit, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(visit?.date || today);
  const [categories, setCategories] = useState(visit?.categories || {});
  const [openCat, setOpenCat] = useState(null);
  const [focusPoints, setFocusPoints] = useState(visit?.focusPoints || []);
  const [inlineActions, setInlineActions] = useState(() => {
    const init = {};
    CATEGORIES.forEach(cat => {
      init[cat] = { isAction: visit?.inlineActions?.[cat]?.isAction || false, text: visit?.inlineActions?.[cat]?.text || "" };
    });
    return init;
  });

  const setCat = (cat, val) => setCategories(prev => ({ ...prev, [cat]: val }));
  const toggleAction = (cat) => setInlineActions(prev => ({ ...prev, [cat]: { ...prev[cat], isAction: !prev[cat].isAction } }));
  const toggleFocus = (point) => setFocusPoints(prev => prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]);
  const filledCount = CATEGORIES.filter(c => categories[c]?.trim()).length;

  const handleSave = () => { onSave({ date, categories, inlineActions, focusPoints }); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>{visit ? "Modifier la visite" : "Nouvelle visite"}</span>
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="form-group">
          <label className="form-label">Date de la visite</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* FOCUS POINTS */}
        <div style={{ background: "#FFF8E1", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1.5px solid #FFD200" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#B8860B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>⚡ Points focus à vérifier</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FOCUS_POINTS.map(point => {
              const checked = focusPoints.includes(point);
              return (
                <label key={point} onClick={() => toggleFocus(point)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", borderRadius: 8, background: checked ? "#E8F5E9" : "#fff", border: `1.5px solid ${checked ? "#2E7D32" : "#eee"}`, transition: "all 0.15s", userSelect: "none" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? "#2E7D32" : "#ccc"}`, background: checked ? "#2E7D32" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                    {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: checked ? "#2E7D32" : "#666" }}>{point}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(filledCount / CATEGORIES.length) * 100}%`, background: "#E30613", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#999", whiteSpace: "nowrap" }}>{filledCount} / {CATEGORIES.length}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          {CATEGORIES.map(cat => {
            const isOpen = openCat === cat;
            const hasNote = !!categories[cat]?.trim();
            const ia = inlineActions[cat];
            return (
              <div key={cat} style={{ marginBottom: 6, borderRadius: 10, overflow: "hidden", border: `1.5px solid ${isOpen ? "#E30613" : hasNote ? "#4CAF50" : "#eee"}`, transition: "border-color 0.2s" }}>

                <div
                  onClick={() => setOpenCat(isOpen ? null : cat)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", cursor: "pointer", background: isOpen ? "#FFF5F5" : hasNote ? "#F1F8F1" : "#fafafa", transition: "background 0.2s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: hasNote ? "#4CAF50" : "#ddd", flexShrink: 0, transition: "background 0.2s" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{cat}</span>
                    {ia.isAction && <span style={{ fontSize: 10, fontWeight: 800, color: "#E30613", background: "#FFEBEE", padding: "2px 6px", borderRadius: 10 }}>ACTION</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {hasNote && !isOpen && <span style={{ fontSize: 11, color: "#4CAF50", fontWeight: 700 }}>✓ Rempli</span>}
                    <span style={{ fontSize: 16, color: "#999", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: "12px 14px", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                    <textarea
                      className="form-textarea"
                      placeholder={`Notes sur ${cat.toLowerCase()}...`}
                      value={categories[cat] || ""}
                      onChange={e => { setCat(cat, e.target.value); if (!e.target.value.trim()) setInlineActions(prev => ({ ...prev, [cat]: { isAction: false, text: "" } })); }}
                      rows={3}
                      style={{ marginBottom: 8, borderColor: ia.isAction ? "#E30613" : undefined }}
                      autoFocus
                    />

                    {categories[cat]?.trim() && (
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                        <input type="checkbox" checked={ia.isAction} onChange={() => toggleAction(cat)} style={{ accentColor: "#E30613", width: 16, height: 16, cursor: "pointer" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: ia.isAction ? "#E30613" : "#888" }}>⚡ Créer un plan d'action (la note ci-dessus sera utilisée)</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Annuler</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>
            {visit ? "Enregistrer" : "Créer la visite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionFormModal({ action, onSave, onClose }) {
  const [text, setText] = useState(action?.text || "");
  const [status, setStatus] = useState(action?.status || "open");
  const [category, setCategory] = useState(action?.category || "");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>{action ? "Modifier l'action" : "Nouvelle action"}</span>
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Description de l'action</label>
          <textarea className="form-textarea" placeholder="Décrivez l'action à entreprendre..." value={text} onChange={e => setText(e.target.value)} rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Statut</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Catégorie liée (optionnel)</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Globale (non liée à une catégorie)</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Annuler</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={() => { if (text.trim()) onSave({ text, status, category }); }}>
            {action ? "Enregistrer" : "Créer l'action"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ restaurant, visits, actions, currentUser, onClose }) {
  const openActions = actions.filter(a => a.status !== "resolved");
  const lastVisit = visits[0];

  const body = `Bonjour ${restaurant.franchisee},

Suite à ma visite du ${lastVisit ? new Date(lastVisit.date).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" }) : "..."} au restaurant ${restaurant.name},

${lastVisit && Object.entries(lastVisit.categories || {}).filter(([,v]) => v).map(([k,v]) => `**${k}**\n${v}`).join("\n\n")}

${openActions.length > 0 ? `PLANS D'ACTION\n\n${openActions.map((a, i) => `${i+1}. ${a.text} [${STATUS_CONFIG[a.status]?.label}]${a.category ? ` (${a.category})` : ""}`).join("\n")}` : ""}

Cordialement,
${currentUser.name}
Consultant Franchise - Quick`;

  const mailtoLink = `mailto:${restaurant.franchiseeEmail}?subject=Visite restaurant ${restaurant.name}&body=${encodeURIComponent(body)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          <span>Email franchisé</span>
          <button className="btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#666", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>Destinataire</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{restaurant.franchisee}</div>
          <div style={{ fontSize: 13, color: "#E30613" }}>{restaurant.franchiseeEmail}</div>
        </div>
        <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.6, maxHeight: 280, overflowY: "auto", whiteSpace: "pre-wrap", marginBottom: 16 }}>{body}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Fermer</button>
          <a href={mailtoLink} className="btn-primary" style={{ flex: 2, textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={onClose}><Icon name="mail" size={15} color="#fff" />Ouvrir dans Mail</a>
        </div>
      </div>
    </div>
  );
}

function RapportView({ visits, actions, restaurants, isAdmin, currentUser, onRestClick }) {
  const [period, setPeriod] = useState("month");
  const [consultantFilter, setConsultantFilter] = useState("all");
  const [restFilter, setRestFilter] = useState("all");
  const [detailView, setDetailView] = useState(null);
  const [consultantSort, setConsultantSort] = useState("visits");

  const getRest = id => restaurants.find(r => r.id === id);
  const now = new Date();
  const periodStart = () => {
    if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    if (period === "year") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    return new Date("2000-01-01");
  };
  const start = periodStart();

  const filteredVisits = visits.filter(v => {
    const d = new Date(v.date);
    const rest = getRest(v.restaurantId);
    const matchPeriod = d >= start;
    const matchConsultant = consultantFilter === "all" || rest?.manager === consultantFilter;
    const matchRest = restFilter === "all" || v.restaurantId === restFilter;
    return matchPeriod && matchConsultant && matchRest;
  });

  const filteredActions = actions.filter(a => {
    const d = new Date(a.createdAt);
    const rest = getRest(a.restaurantId);
    const matchPeriod = d >= start;
    const matchConsultant = consultantFilter === "all" || rest?.manager === consultantFilter;
    const matchRest = restFilter === "all" || a.restaurantId === restFilter;
    return matchPeriod && matchConsultant && matchRest;
  });

  const consultants = [...new Set(restaurants.map(r => r.manager).filter(Boolean))].sort();

  const consultantStats = consultants.map(name => {
    const cv = filteredVisits.filter(v => getRest(v.restaurantId)?.manager === name);
    const ca = filteredActions.filter(a => getRest(a.restaurantId)?.manager === name);
    return {
      name,
      visits: cv.length,
      restsVisited: new Set(cv.map(v => v.restaurantId)).size,
      actionsOpen: ca.filter(a => a.status === "open").length,
      actionsInProgress: ca.filter(a => a.status === "inprogress").length,
      actionsResolved: ca.filter(a => a.status === "resolved").length,
    };
  }).filter(s => s.visits > 0 || s.actionsOpen > 0);

  const restStats = Object.entries(
    filteredVisits.reduce((acc, v) => { acc[v.restaurantId] = (acc[v.restaurantId] || 0) + 1; return acc; }, {})
  ).map(([id, count]) => {
    const rest = getRest(id);
    const restActions = filteredActions.filter(a => a.restaurantId === id);
    const resolved = restActions.filter(a => a.status === "resolved").length;
    const total = restActions.length;
    const pct = total > 0 ? Math.round((resolved / total) * 100) : null;
    return { id, count, rest, actionsTotal: total, actionsResolved: resolved, actionsOpen: restActions.filter(a => a.status === "open").length, resolutionPct: pct };
  }).filter(s => s.rest).sort((a, b) => b.count - a.count).slice(0, 15);

  const visitedIds = new Set(filteredVisits.map(v => v.restaurantId));
  const myRests = consultantFilter === "all" ? restaurants : restaurants.filter(r => r.manager === consultantFilter);
  const notVisited = myRests.filter(r => !visitedIds.has(r.id));
  const periodLabel = { week: "7 derniers jours", month: "30 derniers jours", year: "12 derniers mois", all: "Tout" };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">Rapport</div>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>{periodLabel[period]}</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Période</div>
            <div className="filter-row" style={{ marginBottom: 0 }}>
              {[["week","Semaine"],["month","Mois"],["year","Année"],["all","Tout"]].map(([k,l]) => (
                <span key={k} className={`filter-chip ${period === k ? "active" : ""}`} onClick={() => setPeriod(k)}>{l}</span>
              ))}
            </div>
          </div>
          {isAdmin && (
            <div>
              <div className="form-label" style={{ marginBottom: 6 }}>Consultant</div>
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <span className={`filter-chip ${consultantFilter === "all" ? "active" : ""}`} onClick={() => setConsultantFilter("all")}>Tous</span>
                {consultants.map(c => {
                  const u = USERS.find(u => u.manager === c);
                  return <span key={c} className={`filter-chip ${consultantFilter === c ? "active" : ""}`} onClick={() => setConsultantFilter(c)}>{u?.firstName || c.split(" ")[0]}</span>;
                })}
              </div>
            </div>
          )}
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Restaurant</div>
            <select className="form-select" value={restFilter} onChange={e => setRestFilter(e.target.value)}>
              <option value="all">Tous les restaurants</option>
              {myRests.sort((a,b) => a.name.localeCompare(b.name)).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { num: filteredVisits.length, label: "Visites", color: "#1a1a1a", key: "visits" },
          { num: new Set(filteredVisits.map(v => v.restaurantId)).size, label: "Restaurants visités", color: "#1a1a1a", key: "rests" },
          { num: filteredActions.filter(a => a.status === "open").length, label: "Actions ouvertes", color: "#E53935", key: "open" },
          { num: filteredActions.filter(a => a.status === "resolved").length, label: "Actions résolues", color: "#2E7D32", key: "resolved" },
        ].map((s, i) => (
          <div key={i} className="stat-card" onClick={() => setDetailView(detailView === s.key ? null : s.key)}
            style={{ cursor: "pointer", border: `2px solid ${detailView === s.key ? s.color : "transparent"}`, transition: "all 0.15s" }}>
            <div className="stat-num" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
            {s.num > 0 && <div style={{ fontSize: 10, color: s.color, fontWeight: 700, marginTop: 2 }}>{detailView === s.key ? "▲ Fermer" : "↗ Détail"}</div>}
          </div>
        ))}
      </div>

      
      {detailView === "visits" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">📋 Visites ({filteredVisits.length})</div></div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {[...filteredVisits].sort((a,b) => new Date(b.date) - new Date(a.date)).map((v, i) => {
              const rest = getRest(v.restaurantId);
              return (
                <div key={v.id} style={{ padding: "10px 20px", borderBottom: i < filteredVisits.length-1 ? "1px solid #f0f0f0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{rest?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{v.consultantName} · {new Date(v.date).toLocaleDateString("fr-BE")}</div>
                  </div>
                  <span className="rest-badge">{Object.values(v.categories||{}).filter(Boolean).length} cat.</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {detailView === "rests" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">🍔 Restaurants visités ({new Set(filteredVisits.map(v => v.restaurantId)).size})</div></div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {[...new Set(filteredVisits.map(v => v.restaurantId))].map((id, i, arr) => {
              const rest = getRest(id);
              const count = filteredVisits.filter(v => v.restaurantId === id).length;
              return (
                <div key={id} onClick={() => onRestClick(id)} style={{ padding: "10px 20px", borderBottom: i < arr.length-1 ? "1px solid #f0f0f0" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{rest?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#999" }}>{rest?.town} · {rest?.manager?.split(" ")[0]}</div>
                  </div>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: "#E30613" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(detailView === "open" || detailView === "resolved") && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title" style={{ color: detailView === "open" ? "#E53935" : "#2E7D32" }}>
              {detailView === "open" ? "🔴 Actions ouvertes" : "🟢 Actions résolues"} ({filteredActions.filter(a => detailView === "open" ? a.status !== "resolved" : a.status === "resolved").length})
            </div>
          </div>
          <div style={{ maxHeight: 350, overflowY: "auto" }}>
            {filteredActions.filter(a => detailView === "open" ? a.status !== "resolved" : a.status === "resolved").map((a, i, arr) => {
              const rest = getRest(a.restaurantId);
              const s = STATUS_CONFIG[a.status] || STATUS_CONFIG.open;
              return (
                <div key={a.id} style={{ padding: "10px 20px", borderBottom: i < arr.length-1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{a.text}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 10 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "#999" }}>{rest?.name} · {a.consultantName}</span>
                    {a.category && <span style={{ fontSize: 11, color: "#999", background: "#f0f0f0", padding: "2px 6px", borderRadius: 8 }}>{a.category}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && consultantFilter === "all" && consultantStats.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">Par consultant</div></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  {[
                    { label: "Consultant", key: "name" },
                    { label: "Visites", key: "visits" },
                    { label: "Restaurants", key: "restsVisited" },
                    { label: "Ouvert", key: "actionsOpen" },
                    { label: "En cours", key: "actionsInProgress" },
                    { label: "Résolu", key: "actionsResolved" },
                  ].map(({ label, key }) => {
                    const isActive = consultantSort === key;
                    return (
                      <th key={key} onClick={() => setConsultantSort(key)}
                        style={{ padding: "8px 12px", textAlign: key === "name" ? "left" : "center", fontWeight: 800, color: isActive ? "#E30613" : "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                        {label} {isActive ? "▼" : <span style={{ opacity: 0.3 }}>↕</span>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[...consultantStats].sort((a, b) => {
                  if (consultantSort === "name") return a.name.localeCompare(b.name);
                  return (b[consultantSort] || 0) - (a[consultantSort] || 0);
                }).map((s, i) => (
                  <tr key={s.name} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{s.name.split(" ")[0]}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, color: "#E30613", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18 }}>{s.visits}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#666" }}>{s.restsVisited}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ background: "#FFEBEE", color: "#E53935", fontWeight: 700, padding: "2px 8px", borderRadius: 10, fontSize: 12 }}>{s.actionsOpen}</span></td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ background: "#FFF3E0", color: "#F57C00", fontWeight: 700, padding: "2px 8px", borderRadius: 10, fontSize: 12 }}>{s.actionsInProgress}</span></td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}><span style={{ background: "#E8F5E9", color: "#2E7D32", fontWeight: 700, padding: "2px 8px", borderRadius: 10, fontSize: 12 }}>{s.actionsResolved}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {restStats.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">Restaurants les plus visités</div></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee" }}>
                  {["#","Restaurant","Visites","Actions","Résolues","% Résolution"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Restaurant" ? "left" : "center", fontWeight: 800, color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {restStats.map((s, i) => {
                  const pctColor = s.resolutionPct === null ? "#999" : s.resolutionPct >= 75 ? "#2E7D32" : s.resolutionPct >= 40 ? "#F57C00" : "#E53935";
                  return (
                    <tr key={s.id} onClick={() => onRestClick(s.id)} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background="#f9f9f9"}
                      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 900, color: "#E30613" }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700 }}>{s.rest.name}</div>
                        <div style={{ fontSize: 11, color: "#999" }}>{s.rest.town} · {s.rest.manager.split(" ")[0]}</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: "#1a1a1a" }}>{s.count}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#666" }}>{s.actionsTotal}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ background: "#E8F5E9", color: "#2E7D32", fontWeight: 700, padding: "2px 8px", borderRadius: 10, fontSize: 12 }}>{s.actionsResolved}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {s.resolutionPct !== null ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <span style={{ fontWeight: 800, color: pctColor, fontSize: 14 }}>{s.resolutionPct}%</span>
                            <div style={{ width: 50, height: 4, background: "#eee", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${s.resolutionPct}%`, height: "100%", background: pctColor, borderRadius: 2 }} />
                            </div>
                          </div>
                        ) : <span style={{ color: "#ccc", fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {notVisited.length > 0 && restFilter === "all" && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title" style={{ color: "#E53935" }}>⚠️ Pas encore visités ({notVisited.length})</div></div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {notVisited.map((r, i) => (
              <div key={r.id} onClick={() => onRestClick(r.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", cursor: "pointer", borderBottom: i < notVisited.length - 1 ? "1px solid #f0f0f0" : "none" }}
                onMouseEnter={e => e.currentTarget.style.background="#fff5f5"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>{r.town} · {r.manager.split(" ")[0]}</div>
                </div>
                <Icon name="back" size={14} color="#ccc" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOCUS POINTS SECTION */}
      {filteredVisits.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title">⚡ Points focus — restaurants jamais cochés</div></div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {FOCUS_POINTS.map(point => {
              const restsCovered = new Set(
                filteredVisits.filter(v => (v.focusPoints || []).includes(point)).map(v => v.restaurantId)
              );
              const restsNotCovered = myRests.filter(r => !restsCovered.has(r.id));
              return (
                <div key={point} style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: restsNotCovered.length > 0 ? 8 : 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>⚡ {point}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 12, background: "#E8F5E9", color: "#2E7D32", fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{restsCovered.size} ✓</span>
                      <span style={{ fontSize: 12, background: restsNotCovered.length > 0 ? "#FFEBEE" : "#E8F5E9", color: restsNotCovered.length > 0 ? "#E53935" : "#2E7D32", fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>{restsNotCovered.length} ✗</span>
                    </div>
                  </div>
                  {restsNotCovered.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {restsNotCovered.map(r => (
                        <span key={r.id} onClick={() => onRestClick(r.id)} style={{ fontSize: 11, background: "#f5f5f5", border: "1px solid #eee", padding: "3px 8px", borderRadius: 8, cursor: "pointer", color: "#666" }}>
                          {r.name.replace(" Quick", "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredVisits.length === 0 && (
        <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune donnée pour cette période</div></div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);