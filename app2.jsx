
function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!selectedUser) { setError("Veuillez sélectionner un utilisateur."); return; }
    const user = USERS.find(u => u.id === selectedUser);
    const expectedPwd = user?.id === "admin" ? "Quick234" : "quick2024";
    if (password !== expectedPwd) { setError("Mot de passe incorrect."); return; }
    onLogin(user);
  };

  return (
    <div className="login-wrap">
      <div className="login-logo">QUICK</div>
      <div className="login-sub">Suivi des Visites Restaurants</div>
      <div className="login-card">
        <div className="login-title">Connexion</div>
        <div className="form-group">
          <label className="form-label">Utilisateur</label>
          <select className="form-select" value={selectedUser} onChange={e => { setSelectedUser(e.target.value); setError(""); }}>
            <option value="">Sélectionner...</option>
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input className="form-input" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ marginTop: 20 }}>
          <button className="btn-primary" onClick={handleLogin}>Se connecter</button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => loadUser());
  const [restaurants, setRestaurants] = useState([]);
  const [visits, setVisits] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [selectedRestId, setSelectedRestId] = useState(null);
  const [restTab, setRestTab] = useState("visits");
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [managerFilter, setManagerFilter] = useState("all");
  const [actionStatusFilter, setActionStatusFilter] = useState("all");
  const [editingAction, setEditingAction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [showQuickVisit, setShowQuickVisit] = useState(false);
  const [quickVisitRestId, setQuickVisitRestId] = useState("");

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [rests, vis, acts] = await Promise.all([db.restaurants.getAll(), db.visits.getAll(), db.actions.getAll()]);
      if (rests) setRestaurants(rests.map(r => ({ ...r, contractType: r.contract_type, franchiseeEmail: r.franchisee_email, franchiseePhone: r.franchisee_phone, companyName: r.company_name })));
      if (vis) setVisits(vis.map(v => ({ ...v, restaurantId: v.restaurant_id, consultantId: v.consultant_id, consultantName: v.consultant_name, createdAt: v.created_at })));
      if (acts) setActions(acts.map(a => ({ ...a, restaurantId: a.restaurant_id, consultantId: a.consultant_id, consultantName: a.consultant_name, createdAt: a.created_at })));
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => { if (currentUser) saveUser(currentUser); }, [currentUser]);

  const myRestaurants = currentUser?.role === "admin" ? restaurants :
    restaurants.filter(r => r.manager?.toLowerCase() === currentUser?.manager?.toLowerCase());

  const myRestaurantIds = new Set(myRestaurants.map(r => r.id));

  const filteredRests = myRestaurants.filter(r => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || r.name?.toLowerCase().includes(q) || r.town?.toLowerCase().includes(q) || r.franchisee?.toLowerCase().includes(q);
    const matchM = managerFilter === "all" || r.manager === managerFilter;
    return matchQ && matchM;
  });

  const filteredRestIds = new Set(
    managerFilter === "all" ? [...myRestaurantIds] :
    restaurants.filter(r => r.manager === managerFilter).map(r => r.id)
  );

  const myVisits = visits.filter(v => myRestaurantIds.has(v.restaurantId));
  const myActions = actions.filter(a => myRestaurantIds.has(a.restaurantId));
  const filteredVisits = visits.filter(v => filteredRestIds.has(v.restaurantId));
  const filteredActions = actions.filter(a => filteredRestIds.has(a.restaurantId));

  const selectedRest = restaurants.find(r => r.id === selectedRestId);
  const restVisits = visits.filter(v => v.restaurantId === selectedRestId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const restActions = actions.filter(a => a.restaurantId === selectedRestId);
  const openActions = myActions.filter(a => a.status !== "resolved");
  const managers = [...new Set(restaurants.map(r => r.manager))].sort();

  const handleReset = () => setShowResetConfirm(true);
  const confirmReset = async () => {
    await Promise.all([
      sb("visits?id=neq.none", { method: "DELETE", prefer: "" }),
      sb("actions?id=neq.none", { method: "DELETE", prefer: "" }),
    ]);
    setVisits([]); setActions([]); setView("home"); setShowResetConfirm(false);
  };

  const handleLogout = () => { saveUser(null); setCurrentUser(null); };
  const handleRestClick = (id) => { setSelectedRestId(id); setRestTab("visits"); setView("restaurant"); setSelectedVisit(null); };

  const handleSaveVisit = async (visitData) => {
    const { inlineActions, ...vData } = visitData;
    let visitId;
    if (editingVisit) {
      visitId = editingVisit.id;
      await db.visits.update(visitId, { date: vData.date, categories: vData.categories });
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, ...vData } : v));
      await sb(`actions?visit_id=eq.${visitId}`, { method: "DELETE", prefer: "" });
      setActions(prev => prev.filter(a => a.visitId !== visitId));
    } else {
      visitId = Date.now().toString();
      const newVisit = { id: visitId, restaurant_id: selectedRestId, consultant_id: currentUser.id, consultant_name: currentUser.name, date: vData.date, categories: vData.categories };
      await db.visits.insert(newVisit);
      setVisits(prev => [...prev, { ...newVisit, restaurantId: selectedRestId, consultantId: currentUser.id, consultantName: currentUser.name, createdAt: new Date().toISOString() }]);
    }
    if (inlineActions) {
      const newActs = Object.entries(inlineActions)
        .filter(([cat, ia]) => ia.isAction && vData.categories?.[cat]?.trim())
        .map(([cat]) => ({
          id: `${visitId}_${cat}_${Date.now()}`,
          restaurant_id: selectedRestId,
          visit_id: visitId,
          consultant_id: currentUser.id,
          consultant_name: currentUser.name,
          text: vData.categories[cat].trim(),
          status: "open",
          category: cat,
        }));
      if (newActs.length > 0) {
        await db.actions.insert(newActs);
        setActions(prev => [...prev, ...newActs.map(a => ({ ...a, restaurantId: a.restaurant_id, consultantId: a.consultant_id, consultantName: a.consultant_name, visitId: a.visit_id, createdAt: new Date().toISOString() }))]);
      }
    }
    setShowVisitForm(false); setEditingVisit(null);
  };

  const handleSaveAction = async (actionData) => {
    if (editingAction) {
      await db.actions.update(editingAction.id, actionData);
      setActions(prev => prev.map(a => a.id === editingAction.id ? { ...a, ...actionData } : a));
    } else {
      const newAction = { id: Date.now().toString(), restaurant_id: selectedRestId, consultant_id: currentUser.id, consultant_name: currentUser.name, ...actionData };
      await db.actions.insert(newAction);
      setActions(prev => [...prev, { ...newAction, restaurantId: selectedRestId, consultantId: currentUser.id, consultantName: currentUser.name, createdAt: new Date().toISOString() }]);
    }
    setShowActionForm(false); setEditingAction(null);
  };

  const handleDeleteVisit = (id) => setDeleteConfirm({ type: "visit", id });
  const handleDeleteAction = (id) => setDeleteConfirm({ type: "action", id });

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "visit") { await db.visits.delete(deleteConfirm.id); setVisits(prev => prev.filter(v => v.id !== deleteConfirm.id)); setSelectedVisit(null); }
    if (deleteConfirm.type === "action") { await db.actions.delete(deleteConfirm.id); setActions(prev => prev.filter(a => a.id !== deleteConfirm.id)); }
    setDeleteConfirm(null);
  };

  const updateActionStatus = async (id, status) => {
    await db.actions.update(id, { status });
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  if (loading) return (
    <><style>{styles}</style>
    <div style={{minHeight:"100vh",background:"#E30613",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{textAlign:"center",color:"#fff"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:64,fontWeight:900,marginBottom:16}}>QUICK</div>
        <div style={{fontSize:16,opacity:0.8}}>Chargement des données...</div>
      </div>
    </div></>
  );
  if (!currentUser) return <><style>{styles}</style><LoginScreen onLogin={setCurrentUser} /></>;

  return (
    <>
      <style>{styles}</style>
      <div className="app-wrap">
        <header className="header">
          <div className="header-logo" style={{ cursor: "pointer" }} onClick={() => setView("home")}>QUICK</div>
          <div className="header-right">
            <button onClick={() => { setShowQuickVisit(true); setQuickVisitRestId(""); }} style={{ background: "rgba(255,255,255,0.95)", color: "#E30613", border: "none", padding: "7px 14px", borderRadius: 20, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, letterSpacing: 0.3 }}>
              <Icon name="plus" size={14} color="#E30613" />Visite
            </button>
            <span className="header-user">{currentUser.firstName}</span>
            {currentUser.role === "admin" && (
              <button className="header-logout" style={{ background: "rgba(255,255,255,0.1)" }} onClick={handleReset}>
                <Icon name="trash" size={14} /><span>Reset</span>
              </button>
            )}
            <button className="header-logout" onClick={handleLogout}><Icon name="logout" size={14} /><span>Quitter</span></button>
          </div>
        </header>

        <nav className="nav-bar">
          <div className={`nav-item ${view === "restaurants" ? "active" : ""}`} onClick={() => setView("restaurants")}><Icon name="restaurant" size={15} />Restaurants</div>
          <div className={`nav-item ${view === "visits" ? "active" : ""}`} onClick={() => setView("visits")}><Icon name="visit" size={15} />Visites</div>
          <div className={`nav-item ${view === "actions" ? "active" : ""}`} onClick={() => setView("actions")}>
            <Icon name="action" size={15} />Actions
            {openActions.length > 0 && <span style={{ background: "#E53935", color: "#fff", fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10, marginLeft: 2 }}>{openActions.length}</span>}
          </div>
          <div className={`nav-item ${view === "rapport" ? "active" : ""}`} onClick={() => setView("rapport")}><Icon name="eye" size={15} />Rapport</div>
          {currentUser.role === "admin" && (
            <div className={`nav-item ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}><Icon name="user" size={15} />Admin</div>
          )}
          {view === "restaurant" && selectedRest && (
            <div className="nav-item active"><Icon name="eye" size={15} />{selectedRest.name.replace(" Quick", "")}</div>
          )}
        </nav>

        <main className="main">
          {view === "home" && (
            <HomeView currentUser={currentUser} onNavigate={setView} visits={myVisits} restaurants={restaurants} />
          )}
          {view === "restaurants" && (
            <RestaurantsView restaurants={filteredRests} allRestaurants={restaurants} visits={filteredVisits} actions={filteredActions} searchQ={searchQ} setSearchQ={setSearchQ} managerFilter={managerFilter} setManagerFilter={setManagerFilter} managers={managers} isAdmin={currentUser.role === "admin"} onRestClick={handleRestClick} onGoToActions={() => setView("actions")} onGoToVisits={() => setView("visits")} />
          )}
          {view === "visits" && (
            <AllVisitsView visits={filteredVisits} restaurants={restaurants} onRestClick={handleRestClick} />
          )}
          {view === "actions" && (
            <ActionsView actions={filteredActions} restaurants={restaurants} statusFilter={actionStatusFilter} setStatusFilter={setActionStatusFilter} onUpdateStatus={updateActionStatus} onDelete={handleDeleteAction} onEdit={(a) => { setEditingAction(a); setSelectedRestId(a.restaurantId); setShowActionForm(true); }} onRestClick={handleRestClick} />
          )}
          {view === "rapport" && (
            <RapportView visits={filteredVisits} actions={filteredActions} restaurants={myRestaurants} isAdmin={currentUser.role === "admin"} currentUser={currentUser} onRestClick={handleRestClick} managerFilter={managerFilter} />
          )}
          {view === "admin" && currentUser.role === "admin" && (
            <AdminView restaurants={restaurants} setRestaurants={setRestaurants} users={USERS} />
          )}
          {view === "restaurant" && selectedRest && (
            <RestaurantDetail
              restaurant={selectedRest} visits={restVisits} actions={restActions} restTab={restTab} setRestTab={setRestTab}
              selectedVisit={selectedVisit} setSelectedVisit={setSelectedVisit}
              onBack={() => setView("restaurants")}
              onNewVisit={() => { setEditingVisit(null); setShowVisitForm(true); }}
              onEditVisit={(v) => { setEditingVisit(v); setShowVisitForm(true); }}
              onDeleteVisit={handleDeleteVisit}
              onNewAction={() => { setEditingAction(null); setShowActionForm(true); }}
              onEditAction={(a) => { setEditingAction(a); setShowActionForm(true); }}
              onDeleteAction={handleDeleteAction}
              onUpdateStatus={updateActionStatus}
              onEmail={() => {}}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {showVisitForm && (
        <VisitFormModal visit={editingVisit} onSave={handleSaveVisit} onClose={() => { setShowVisitForm(false); setEditingVisit(null); }} />
      )}
      {showActionForm && selectedRest && (
        <ActionFormModal action={editingAction} onSave={handleSaveAction} onClose={() => { setShowActionForm(false); setEditingAction(null); }} />
      )}
      {showQuickVisit && (
        <div className="modal-overlay" onClick={() => setShowQuickVisit(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <span>Nouvelle visite</span>
              <button className="btn-icon" onClick={() => setShowQuickVisit(false)}><Icon name="close" size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Sélectionner le restaurant</label>
              <select className="form-select" value={quickVisitRestId} onChange={e => setQuickVisitRestId(e.target.value)}>
                <option value="">Choisir un restaurant...</option>
                {myRestaurants.sort((a,b) => a.name.localeCompare(b.name)).map(r => (
                  <option key={r.id} value={r.id}>{r.name} — {r.town}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowQuickVisit(false)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={() => {
                if (!quickVisitRestId) return;
                setSelectedRestId(quickVisitRestId);
                setEditingVisit(null);
                setShowQuickVisit(false);
                setShowVisitForm(true);
                setView("restaurant");
                setRestTab("visits");
              }}>
                Démarrer la visite
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 340 }}>
            <div className="modal-title" style={{ fontSize: 18 }}>
              {deleteConfirm.type === "visit" ? "🗑️ Supprimer la visite ?" : "🗑️ Supprimer l'action ?"}
            </div>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>
              Cette suppression est <strong>irréversible</strong>.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1, background: "#E53935" }} onClick={confirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-title" style={{ fontSize: 18 }}>⚠️ Réinitialiser les données</div>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, marginBottom: 20 }}>
              Toutes les visites et actions enregistrées seront <strong>définitivement effacées</strong>. Cette action est irréversible.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setShowResetConfirm(false)}>Annuler</button>
              <button className="btn-primary" style={{ flex: 1, background: "#E53935" }} onClick={confirmReset}>Effacer tout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RestaurantsView({ restaurants, allRestaurants, visits, actions, searchQ, setSearchQ, managerFilter, setManagerFilter, managers, isAdmin, onRestClick, onGoToActions, onGoToVisits }) {
  const getOpenActions = (id) => actions.filter(a => a.restaurantId === id && a.status !== "resolved").length;
  const getLastVisit = (id) => {
    const v = visits.filter(v => v.restaurantId === id).sort((a,b) => new Date(b.date) - new Date(a.date));
    return v[0]?.date;
  };
  const totalVisits = visits.length;
  const totalOpenActions = actions.filter(a => a.status !== "resolved").length;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card" onClick={() => setSearchQ("")} style={{ cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.border="2px solid #E30613"}
          onMouseLeave={e => e.currentTarget.style.border="2px solid transparent"}>
          <div className="stat-num">{restaurants.length}</div>
          <div className="stat-label">Restaurants</div>
          <div style={{ fontSize: 10, color: "#E30613", fontWeight: 700, marginTop: 2 }}>↗ Voir tout</div>
        </div>
        <div className="stat-card" onClick={onGoToVisits} style={{ cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.border="2px solid #E30613"}
          onMouseLeave={e => e.currentTarget.style.border="2px solid transparent"}>
          <div className="stat-num">{totalVisits}</div>
          <div className="stat-label">Visites</div>
          <div style={{ fontSize: 10, color: "#E30613", fontWeight: 700, marginTop: 2 }}>↗ Voir tout</div>
        </div>
        <div className="stat-card" onClick={onGoToActions} style={{ cursor: totalOpenActions > 0 ? "pointer" : "default", border: totalOpenActions > 0 ? "2px solid #E53935" : "2px solid transparent", transition: "all 0.2s" }}>
          <div className="stat-num" style={{ color: totalOpenActions > 0 ? "#E53935" : "#2E7D32" }}>{totalOpenActions}</div>
          <div className="stat-label">Actions ouvertes</div>
          {totalOpenActions > 0 && <div style={{ fontSize: 10, color: "#E53935", fontWeight: 700, marginTop: 2 }}>↗ Voir tout</div>}
        </div>
      </div>

      <div className="search-wrap">
        <span className="search-icon"><Icon name="search" size={16} /></span>
        <input className="search-input" placeholder="Rechercher un restaurant, ville, franchisé..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      {isAdmin && (
        <div className="filter-row">
          <span className={`filter-chip ${managerFilter === "all" ? "active" : ""}`} onClick={() => setManagerFilter("all")}>Tous</span>
          {managers.map(m => {
            const u = USERS.find(u => u.manager === m);
            return <span key={m} className={`filter-chip ${managerFilter === m ? "active" : ""}`} onClick={() => setManagerFilter(m)}>{u?.firstName || m}</span>;
          })}
        </div>
      )}

      {restaurants.length === 0 && <div className="empty"><div className="empty-icon"><Icon name="search" size={40} /></div><div className="empty-text">Aucun restaurant trouvé</div></div>}

      {restaurants.map(r => {
        const oa = getOpenActions(r.id);
        const lv = getLastVisit(r.id);
        return (
          <div key={r.id} className="rest-card" onClick={() => onRestClick(r.id)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rest-name">{r.name}</div>
              <div className="rest-meta">{r.town} · {r.franchisee}</div>
              {lv && <div className="rest-meta" style={{ marginTop: 2 }}>Dernière visite : {new Date(lv).toLocaleDateString("fr-BE")}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <span className="rest-badge">{r.typology}</span>
              {oa > 0 && <span className="rest-actions-count">{oa} action{oa > 1 ? "s" : ""}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RestaurantDetail({ restaurant: r, visits, actions, restTab, setRestTab, selectedVisit, setSelectedVisit, onBack, onNewVisit, onEditVisit, onDeleteVisit, onNewAction, onEditAction, onDeleteAction, onUpdateStatus, onEmail, currentUser }) {
  const tabs = ["visits", "infos", ...CATEGORIES];
  const tabLabels = { visits: "Visites", infos: "Informations" };

  const getCatEntries = (cat) => {
    const entries = [];
    visits.forEach(v => { if (v.categories?.[cat]) entries.push({ date: v.date, text: v.categories[cat], consultant: v.consultantName }); });
    return entries.sort((a,b) => new Date(b.date) - new Date(a.date));
  };

  const openActionsCount = actions.filter(a => a.status !== "resolved").length;

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="page-back" onClick={onBack}><Icon name="back" size={16} />Retour</button>
          <div className="page-title" style={{ marginTop: 4 }}>{r.name}</div>
          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{r.address}, {r.zip} {r.town}</div>
        </div>
        <button className="btn-secondary" onClick={onBack} style={{ marginTop: 4 }}><Icon name="back" size={14} />Retour</button>
      </div>

      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => { setRestTab("visits"); setSelectedVisit(null); }} style={{ cursor: "pointer", border: restTab === "visits" ? "2px solid #E30613" : "2px solid transparent", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor="#E30613"}
          onMouseLeave={e => e.currentTarget.style.borderColor= restTab === "visits" ? "#E30613" : "transparent"}>
          <div className="stat-num">{visits.length}</div>
          <div className="stat-label">Visites</div>
          <div style={{ fontSize: 10, color: "#E30613", fontWeight: 700, marginTop: 2 }}>↗ Voir</div>
        </div>
        <div className="stat-card" onClick={() => { setRestTab("actions_open"); setSelectedVisit(null); }} style={{ cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor="#E53935"}
          onMouseLeave={e => e.currentTarget.style.borderColor="transparent"}>
          <div className="stat-num" style={{ color: openActionsCount > 0 ? "#E53935" : "#2E7D32" }}>{openActionsCount}</div>
          <div className="stat-label">Actions ouvertes</div>
          {openActionsCount > 0 && <div style={{ fontSize: 10, color: "#E53935", fontWeight: 700, marginTop: 2 }}>↗ Voir</div>}
        </div>
        <div className="stat-card" onClick={() => { setRestTab("actions_resolved"); setSelectedVisit(null); }} style={{ cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor="#2E7D32"}
          onMouseLeave={e => e.currentTarget.style.borderColor="transparent"}>
          <div className="stat-num" style={{ color: "#2E7D32" }}>{actions.filter(a => a.status === "resolved").length}</div>
          <div className="stat-label">Résolues</div>
          {actions.filter(a => a.status === "resolved").length > 0 && <div style={{ fontSize: 10, color: "#2E7D32", fontWeight: 700, marginTop: 2 }}>↗ Voir</div>}
        </div>
      </div>

      
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["visits","infos"].map(t => (
          <button key={t} className={`tab ${restTab === t ? "active" : ""}`} onClick={() => { setRestTab(t); setSelectedVisit(null); }} style={{ flex: 1, padding: "10px 8px", fontSize: 13 }}>
            {t === "visits" ? "📋 Visites" : "ℹ️ Infos"}
          </button>
        ))}
      </div>

      
      {restTab !== "visits" && restTab !== "infos" && (
        <div style={{ marginBottom: 16 }}>
          <button className="page-back" onClick={() => setRestTab("visits")} style={{ marginBottom: 12 }}><Icon name="back" size={16} />Retour</button>
        </div>
      )}
      {restTab === "visits" || restTab === "infos" ? null : null}

      {(restTab === "visits" || restTab === "infos") && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Catégories</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(cat => {
              const entries = getCatEntries(cat);
              const hasContent = entries.length > 0;
              const isActive = restTab === cat;
              const lastEntry = entries[0];
              return (
                <div key={cat} onClick={() => { setRestTab(cat); setSelectedVisit(null); }}
                  style={{ background: isActive ? "#E30613" : hasContent ? "#fff" : "#fafafa", border: `1.5px solid ${isActive ? "#E30613" : hasContent ? "#E30613" : "#eee"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isActive ? "#fff" : hasContent ? "#E30613" : "#ddd", margin: "0 auto 6px" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? "#fff" : hasContent ? "#1a1a1a" : "#aaa", lineHeight: 1.3 }}>{cat}</div>
                  {hasContent && !isActive && <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>{entries.length} note{entries.length > 1 ? "s" : ""}</div>}
                  {!hasContent && !isActive && <div style={{ fontSize: 10, color: "#ccc", marginTop: 3 }}>Vide</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {restTab === "visits" && (
        <div>
          {!selectedVisit && (
            <>
              <div className="page-header" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{visits.length} visite{visits.length !== 1 ? "s" : ""}</div>
                <button className="btn-primary" style={{ width: "auto", padding: "10px 18px", fontSize: 15 }} onClick={onNewVisit}><Icon name="plus" size={14} color="#fff" /> Nouvelle visite</button>
              </div>
              {visits.length === 0 && <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune visite enregistrée</div></div>}
              {visits.map(v => {
                const cats = Object.entries(v.categories || {}).filter(([,val]) => val);
                return (
                  <div key={v.id} className="visit-item" onClick={() => setSelectedVisit(v)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="visit-date">{new Date(v.date).toLocaleDateString("fr-BE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                        <div className="visit-consultant">{v.consultantName}</div>
                        {cats.length > 0 && <div className="visit-preview">{cats.map(([k]) => k).join(" · ")}</div>}
                      </div>
                      <span className="rest-badge">{cats.length} catégorie{cats.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {selectedVisit && (
            <VisitDetail visit={selectedVisit} actions={actions} restaurant={r} onBack={() => setSelectedVisit(null)} onEdit={() => onEditVisit(selectedVisit)} onDelete={() => onDeleteVisit(selectedVisit.id)} onNewAction={onNewAction} onEditAction={onEditAction} onDeleteAction={onDeleteAction} onUpdateStatus={onUpdateStatus} />
          )}
        </div>
      )}

      {restTab === "visits" && false && null}

      {restTab === "infos" && (
        <div className="card">
          <div className="card-body">
            <div className="info-grid">
              <div className="info-item"><label>ID Restaurant</label><p>#{r.id}</p></div>
              <div className="info-item"><label>Typologie</label><p>{r.typology}</p></div>
              <div className="info-item"><label>Type de contrat</label><p>{r.contractType}</p></div>
              <div className="info-item"><label>Langue</label><p>{r.language}</p></div>
              <div className="info-item"><label>Pays</label><p>{r.country}</p></div>
              <div className="info-item"><label>Consultant</label><p>{r.manager}</p></div>
            </div>
            <div className="divider" />
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>Franchisé / Manager</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{r.franchisee}</div>
              {r.companyName && <div style={{ fontSize: 13, color: "#666" }}>{r.companyName}</div>}
              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                {r.franchiseeEmail && <a href={`mailto:${r.franchiseeEmail}`} style={{ fontSize: 13, color: "#E30613", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Icon name="mail" size={13} />{r.franchiseeEmail}</a>}
                {r.franchiseePhone && <a href={`tel:${r.franchiseePhone}`} style={{ fontSize: 13, color: "#E30613", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Icon name="phone" size={13} />{r.franchiseePhone}</a>}
              </div>
            </div>
            <div className="divider" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>Adresse</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>{r.address}<br />{r.zip} {r.town}, {r.country}</div>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(r.name + " " + r.town)}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#E30613", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="map" size={13} />Voir sur Google Maps</a>
            </div>
            {r.phone && <><div className="divider" /><div><a href={`tel:${r.phone}`} style={{ fontSize: 14, color: "#E30613", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><Icon name="phone" size={14} />{r.phone}</a></div></>}
          </div>
        </div>
      )}

      {CATEGORIES.includes(restTab) && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <button className="page-back" onClick={() => setRestTab("visits")}><Icon name="back" size={16} />Retour</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, color: "#1a1a1a", marginTop: 6 }}>{restTab}</div>
            </div>
            <span className="rest-badge">{getCatEntries(restTab).length} note{getCatEntries(restTab).length !== 1 ? "s" : ""}</span>
          </div>
          {getCatEntries(restTab).length === 0 && <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune note pour cette catégorie</div></div>}
          {getCatEntries(restTab).map((e, i) => (
            <div key={i} className="cat-entry">
              <div className="cat-entry-date">{new Date(e.date).toLocaleDateString("fr-BE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {e.consultant}</div>
              <div className="cat-entry-text">{e.text}</div>
            </div>
          ))}

          {actions.filter(a => a.category === restTab).length > 0 && (
            <>
              <div style={{ marginTop: 20, marginBottom: 10, fontSize: 13, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "0.8px" }}>Actions liées</div>
              {actions.filter(a => a.category === restTab).map(a => (
                <ActionItem key={a.id} action={a} onUpdateStatus={onUpdateStatus} onEdit={onEditAction} onDelete={onDeleteAction} />
              ))}
            </>
          )}
        </div>
      )}

      {restTab === "visits" && !selectedVisit && actions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>Plans d'action</div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 14 }} onClick={onNewAction}><Icon name="plus" size={13} color="#fff" /> Ajouter</button>
          </div>
          {actions.map(a => <ActionItem key={a.id} action={a} onUpdateStatus={onUpdateStatus} onEdit={onEditAction} onDelete={onDeleteAction} />)}
        </div>
      )}
      {restTab === "visits" && !selectedVisit && actions.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>Plans d'action</div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 16px", fontSize: 14 }} onClick={onNewAction}><Icon name="plus" size={13} color="#fff" /> Ajouter</button>
          </div>
          <div className="empty"><div className="empty-text">Aucun plan d'action</div></div>
        </div>
      )}

      
      {(restTab === "actions_open" || restTab === "actions_resolved") && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <button className="page-back" onClick={() => setRestTab("visits")}><Icon name="back" size={16} />Retour</button>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, marginTop: 6, color: restTab === "actions_open" ? "#E53935" : "#2E7D32" }}>
                {restTab === "actions_open" ? "🔴 Actions ouvertes" : "🟢 Actions résolues"}
              </div>
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "8px 14px", fontSize: 13 }} onClick={onNewAction}><Icon name="plus" size={13} color="#fff" /> Ajouter</button>
          </div>
          {actions.filter(a => restTab === "actions_open" ? a.status !== "resolved" : a.status === "resolved").length === 0 && (
            <div className="empty"><div className="empty-text">Aucune action {restTab === "actions_open" ? "ouverte" : "résolue"}</div></div>
          )}
          {actions.filter(a => restTab === "actions_open" ? a.status !== "resolved" : a.status === "resolved").map(a => (
            <ActionItem key={a.id} action={a} onUpdateStatus={onUpdateStatus} onEdit={onEditAction} onDelete={onDeleteAction} />
          ))}
        </div>
      )}
    </div>
  );
}
