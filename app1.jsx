const { useState, useEffect } = React;

const SUPABASE_URL = "https://alncohvoaqoxahbdwhnv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbmNvaHZvYXFveGFoYmR3aG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MzU0MjcsImV4cCI6MjA5NTIxMTQyN30.apdHj2R9O74ttuPMDwsJqIFoCb4WchvuyjnTUn7Y4Oo";

const sb = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) { const e = await res.text(); console.error("Supabase error:", e); return null; }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const db = {
  restaurants: {
    getAll: () => sb("restaurants?select=*&order=name"),
    upsert: (data) => sb("restaurants", { method: "POST", body: JSON.stringify(data), headers: { "Prefer": "resolution=merge-duplicates,return=representation" } }),
  },
  visits: {
    getAll: () => sb("visits?select=*&order=created_at.desc"),
    insert: (data) => sb("visits", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => sb(`visits?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id) => sb(`visits?id=eq.${id}`, { method: "DELETE", prefer: "" }),
  },
  actions: {
    getAll: () => sb("actions?select=*&order=created_at.desc"),
    insert: (data) => sb("actions", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => sb(`actions?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id) => sb(`actions?id=eq.${id}`, { method: "DELETE", prefer: "" }),
  },
};

const CATEGORIES = ["Qualité","Service","Propreté","Rush Ready","Baromètres clients","Focus client","Technique","Tour du restaurant","Hommes & certification","Ventes","Tests & projets"];
const USERS = [
  { id: "admin", name: "Gregory De Broux", firstName: "Gregory", email: "gregory@quick.be", role: "admin", manager: "all" },
  { id: "u1", name: "Alexandre Wauters", firstName: "Alexandre", email: "alexandre.wauters@quick.be", role: "consultant", manager: "Alexandre Wauters" },
  { id: "u2", name: "Florent De Deyn", firstName: "Florent", email: "florent.dedeyn@quick.be", role: "consultant", manager: "Florent De Deyn" },
  { id: "u3", name: "Frank Perenzin", firstName: "Frank", email: "frank.perenzin@quick.be", role: "consultant", manager: "Frank Perenzin" },
  { id: "u4", name: "Pierre Adam", firstName: "Pierre", email: "pierre.adam@quick.be", role: "consultant", manager: "Pierre Adam" },
  { id: "u5", name: "Raphaël Coenen", firstName: "Raphaël", email: "raphael.coenen@quick.be", role: "consultant", manager: "Raphaël Coenen" },
];
const STATUS_CONFIG = { open: { label: "Ouvert", color: "#E53935", bg: "#FFEBEE" }, inprogress: { label: "En cours", color: "#F57C00", bg: "#FFF3E0" }, resolved: { label: "Résolu", color: "#2E7D32", bg: "#E8F5E9" } };

const loadUser = () => { try { const v = localStorage.getItem("qvt_user"); return v ? JSON.parse(v) : null; } catch { return null; } };
const saveUser = (u) => { try { localStorage.setItem("qvt_user", JSON.stringify(u)); } catch {} };
const clearAll = () => { try { localStorage.removeItem("qvt_user"); } catch {} };

const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    restaurant: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    visit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    action: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
    map: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return icons[name] || null;
};

const styles = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: 'Barlow', sans-serif; background: #f5f5f5; color: #1a1a1a; } :root { --red: #E30613; --red-dark: #B0000A; --red-light: #ff1a1a; --yellow: #FFD200; --black: #1a1a1a; --white: #ffffff; --gray: #f0f0f0; --gray-mid: #cccccc; --gray-dark: #666666; --radius: 12px; --shadow: 0 2px 12px rgba(0,0,0,0.10); --shadow-lg: 0 8px 32px rgba(0,0,0,0.15); } /* LOGIN */ .login-wrap { min-height: 100vh; background: var(--red); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; } .login-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 64px; font-weight: 900; color: var(--white); letter-spacing: -2px; line-height: 1; margin-bottom: 8px; } .login-sub { color: rgba(255,255,255,0.75); font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; } .login-card { background: var(--white); border-radius: 20px; padding: 36px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); } .login-title { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 800; color: var(--black); margin-bottom: 24px; } .form-group { margin-bottom: 16px; } .form-label { display: block; font-size: 12px; font-weight: 700; color: var(--gray-dark); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; } .form-input { width: 100%; padding: 12px 16px; border: 2px solid var(--gray); border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 15px; color: var(--black); background: var(--white); transition: border-color 0.2s; outline: none; } .form-input:focus { border-color: var(--red); } .form-select { width: 100%; padding: 12px 16px; border: 2px solid var(--gray); border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 15px; color: var(--black); background: var(--white); outline: none; cursor: pointer; } .form-select:focus { border-color: var(--red); } .form-textarea { width: 100%; padding: 12px 16px; border: 2px solid var(--gray); border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 14px; color: var(--black); background: var(--white); resize: vertical; outline: none; min-height: 80px; } .form-textarea:focus { border-color: var(--red); } .btn-primary { width: 100%; padding: 14px; background: var(--red); color: var(--white); border: none; border-radius: var(--radius); font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 1px; cursor: pointer; transition: background 0.2s; } .btn-primary:hover { background: var(--red-dark); } .btn-secondary { padding: 10px 18px; background: var(--gray); color: var(--black); border: none; border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; display: inline-flex; align-items: center; gap: 6px; } .btn-secondary:hover { background: var(--gray-mid); } .btn-danger { padding: 10px 18px; background: #FFEBEE; color: var(--red); border: none; border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; } .btn-icon { padding: 8px; background: transparent; border: none; cursor: pointer; border-radius: 8px; display: inline-flex; align-items: center; transition: background 0.15s; } .btn-icon:hover { background: var(--gray); } .error-msg { color: var(--red); font-size: 13px; font-weight: 600; margin-top: 8px; } /* LAYOUT */ .app-wrap { min-height: 100vh; display: flex; flex-direction: column; } .header { background: var(--red); padding: 0 20px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.2); } .header-logo { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; color: var(--white); letter-spacing: -1px; } .header-right { display: flex; align-items: center; gap: 12px; } .header-user { color: rgba(255,255,255,0.9); font-size: 13px; font-weight: 600; } .header-logout { background: rgba(255,255,255,0.15); border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: white; display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; transition: background 0.2s; } .header-logout:hover { background: rgba(255,255,255,0.25); } .nav-bar { background: var(--white); border-bottom: 2px solid var(--gray); display: flex; overflow-x: auto; } .nav-item { padding: 14px 20px; font-size: 13px; font-weight: 700; color: var(--gray-dark); cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap; transition: all 0.2s; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; } .nav-item.active { color: var(--red); border-bottom-color: var(--red); } .nav-item:hover { color: var(--black); } .main { flex: 1; padding: 20px; max-width: 900px; margin: 0 auto; width: 100%; } @media (max-width: 600px) { .main { padding: 12px; } } /* PAGE HEADER */ .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; } .page-title { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 800; color: var(--black); } .page-back { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--gray-dark); cursor: pointer; background: none; border: none; padding: 0; } .page-back:hover { color: var(--red); } /* CARDS */ .card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 12px; overflow: hidden; } .card-header { padding: 16px 20px; border-bottom: 1px solid var(--gray); display: flex; align-items: center; justify-content: space-between; } .card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; color: var(--black); } .card-body { padding: 16px 20px; } /* RESTAURANT CARD */ .rest-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px 20px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; border-left: 4px solid transparent; display: flex; align-items: center; justify-content: space-between; gap: 12px; } .rest-card:hover { box-shadow: var(--shadow-lg); border-left-color: var(--red); transform: translateY(-1px); } .rest-name { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; color: var(--black); } .rest-meta { font-size: 13px; color: var(--gray-dark); margin-top: 2px; } .rest-badge { background: var(--gray); color: var(--gray-dark); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; } .rest-actions-count { background: var(--red); color: var(--white); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; white-space: nowrap; } /* SEARCH */ .search-wrap { position: relative; margin-bottom: 16px; } .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gray-dark); } .search-input { width: 100%; padding: 11px 16px 11px 40px; border: 2px solid var(--gray); border-radius: var(--radius); font-family: 'Barlow', sans-serif; font-size: 14px; outline: none; } .search-input:focus { border-color: var(--red); } /* VISIT LIST */ .visit-item { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 18px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; border-left: 4px solid var(--red); } .visit-item:hover { box-shadow: var(--shadow-lg); } .visit-date { font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 800; color: var(--black); } .visit-consultant { font-size: 13px; color: var(--gray-dark); font-weight: 500; } .visit-preview { font-size: 13px; color: var(--gray-dark); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } /* RESTAURANT DETAIL TABS */ .tabs { display: flex; overflow-x: auto; gap: 4px; margin-bottom: 20px; background: var(--white); padding: 6px; border-radius: var(--radius); box-shadow: var(--shadow); } .tab { padding: 8px 14px; font-size: 12px; font-weight: 700; color: var(--gray-dark); cursor: pointer; border-radius: 8px; white-space: nowrap; transition: all 0.2s; border: none; background: transparent; letter-spacing: 0.3px; } .tab.active { background: var(--red); color: var(--white); } .tab:hover:not(.active) { background: var(--gray); color: var(--black); } /* VISIT FORM */ .category-section { margin-bottom: 16px; } .category-label { font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 800; color: var(--black); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; } .category-dot { width: 8px; height: 8px; background: var(--red); border-radius: 50%; flex-shrink: 0; } /* ACTION ITEM */ .action-item { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 18px; margin-bottom: 8px; border-left: 4px solid var(--gray-mid); } .action-text { font-size: 14px; color: var(--black); line-height: 1.5; } .action-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; } .status-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.5px; } .action-category { font-size: 11px; color: var(--gray-dark); background: var(--gray); padding: 3px 8px; border-radius: 20px; } .action-date { font-size: 11px; color: var(--gray-dark); } /* INFO GRID */ .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } @media (max-width: 500px) { .info-grid { grid-template-columns: 1fr; } } .info-item label { font-size: 11px; font-weight: 700; color: var(--gray-dark); text-transform: uppercase; letter-spacing: 0.8px; } .info-item p { font-size: 14px; color: var(--black); font-weight: 500; margin-top: 2px; } /* MODAL */ .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; padding: 0; } @media (min-width: 600px) { .modal-overlay { align-items: center; padding: 20px; } } .modal { background: var(--white); border-radius: 20px 20px 0 0; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 24px; } @media (min-width: 600px) { .modal { border-radius: 20px; } } .modal-title { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 800; color: var(--black); margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; } /* STAT CARDS */ .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; } .stat-card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px 16px; text-align: center; } .stat-num { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 900; color: var(--red); line-height: 1; } .stat-label { font-size: 11px; color: var(--gray-dark); font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; } /* DIVIDER */ .divider { height: 1px; background: var(--gray); margin: 16px 0; } /* EMPTY */ .empty { text-align: center; padding: 40px 20px; color: var(--gray-dark); } .empty-icon { opacity: 0.3; margin-bottom: 12px; } .empty-text { font-size: 15px; font-weight: 600; } /* FILTER ROW */ .filter-row { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; } .filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: 2px solid var(--gray); background: var(--white); color: var(--gray-dark); white-space: nowrap; transition: all 0.15s; } .filter-chip.active { background: var(--red); border-color: var(--red); color: var(--white); } /* CATEGORY HISTORY ITEMS */ .cat-entry { padding: 10px 14px; background: var(--gray); border-radius: 8px; margin-bottom: 8px; } .cat-entry-date { font-size: 11px; font-weight: 700; color: var(--gray-dark); margin-bottom: 4px; } .cat-entry-text { font-size: 14px; color: var(--black); line-height: 1.5; } /* SCROLLBAR */ ::-webkit-scrollbar { width: 6px; height: 6px; } ::-webkit-scrollbar-track { background: var(--gray); } ::-webkit-scrollbar-thumb { background: var(--gray-mid); border-radius: 3px; }`;

const QUOTES = [
  "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte. — Churchill",
  "La qualité n'est pas un acte, c'est une habitude. — Aristote",
  "Ensemble, chaque visite est un pas vers l'excellence. — Quick",
  "Un client satisfait est la meilleure des stratégies. — Michael LeBoeuf",
  "L'excellence est un art que l'on n'acquiert que par l'exercice constant. — Aristote",
  "Ce qui se mesure s'améliore. — Peter Drucker",
  "Le détail fait la perfection, et la perfection n'est pas un détail. — Léonard de Vinci",
  "Vos clients les plus mécontents sont votre plus grande source d'apprentissage. — Bill Gates",
  "Il n'y a pas de vent favorable pour celui qui ne sait pas où il va. — Sénèque",
  "La motivation vous démarre, l'habitude vous fait continuer. — Jim Ryun",
  "Chaque jour est une nouvelle chance de faire mieux qu'hier.",
  "La réussite appartient à ceux qui se lèvent tôt… et visitent leurs restaurants ! — Quick Team",
  "Un restaurant visité est un restaurant accompagné.",
  "La confiance se construit visite après visite.",
  "Soyez le changement que vous voulez voir dans vos restaurants. — Gandhi (adapté)",
  "Les grands résultats viennent des petites actions répétées chaque jour.",
  "Votre présence sur le terrain est le meilleur des soutiens.",
  "L'attention aux détails fait toute la différence entre bon et excellent.",
  "Chaque franchisé que vous visitez est un partenaire que vous renforcez.",
  "Le terrain est là où les décisions prennent vie.",
  "Un bon consultant ne donne pas des ordres, il inspire des solutions.",
  "La persévérance transforme les défis en victoires.",
  "Inspirer, accompagner, faire grandir — c'est votre mission au quotidien.",
  "L'excellence opérationnelle commence par une visite attentive.",
  "Chaque action résolue est un progrès pour le restaurant et son équipe.",
  "Le succès est collectif. Chaque visite renforce le réseau Quick.",
  "Regardez toujours loin, mais commencez par le restaurant devant vous.",
  "La discipline est le pont entre les objectifs et la réalité.",
  "Un franchisé accompagné est un franchisé qui performe.",
  "Aujourd'hui est une excellente journée pour faire une belle visite !",
  "La passion pour la qualité se voit dans chaque détail du restaurant.",
];

const JOKES = [
  "Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tomberaient dans le bateau !",
  "Un homme entre dans une bibliothèque et demande un hamburger. Le bibliothécaire dit : 'Monsieur, c'est une bibliothèque !' L'homme chuchote : 'Pardon… un hamburger, s'il vous plaît.'",
  "Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël !",
  "Qu'est-ce qu'un crocodile qui surveille la cour d'école ? Un sac à dents !",
  "Pourquoi les plantes ne peuvent pas utiliser Internet ? Parce qu'elles ont peur de la souris !",
  "Comment appelle-t-on un canif ? Un petit fien !",
  "Qu'est-ce qu'un genou sans genou ? Un elbow !",
  "Pourquoi le scarabée est nul en informatique ? Parce qu'il a un bug !",
  "Qu'est-ce qu'un chat qui tombe dans une poubelle ? Une catastrophe !",
  "Comment appelle-t-on un boomerang qui ne revient pas ? Un bâton !",
  "Pourquoi les flamants roses se tiennent sur une seule patte ? Parce que s'ils levaient les deux, ils tomberaient !",
  "Qu'est-ce qu'un canif ? Un petit fien. Et un caniveau ? Un petit vieux !",
  "Comment appelle-t-on un Belge sur la Lune ? Un astronaute, comme tout le monde !",
  "Pourquoi les plongeurs plongent en arrière ? Parce que s'ils plongeaient en avant, ils resteraient dans le bateau !",
  "Qu'est-ce qu'un chameau sans bosse ? Un chameau vide !",
];

function HomeView({ currentUser, onNavigate, visits, restaurants }) {
  const dayIndex = (arr) => { const d = new Date(); return Math.floor(d.getTime() / 86400000) % arr.length; };
  const todayQuote = QUOTES[dayIndex(QUOTES)];
  const todayJoke = JOKES[dayIndex(JOKES)];
  const today = new Date().toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [calDate, setCalDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const monthLabel = calDate.toLocaleDateString("fr-BE", { month: "long", year: "numeric" });

  const getRest = id => restaurants.find(r => r.id === id);

  const visitsByDate = {};
  visits.forEach(v => {
    const d = v.date?.slice(0, 10);
    if (!d) return;
    if (!visitsByDate[d]) visitsByDate[d] = [];
    visitsByDate[d].push(v);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const dayVisits = selectedDay ? (visitsByDate[selectedDay] || []) : [];

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #E30613 0%, #B0000A 100%)", borderRadius: 16, padding: "28px 20px", marginBottom: 16, color: "#fff" }}>
        <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, textTransform: "capitalize", marginBottom: 6 }}>{today}</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>Bonjour {currentUser.firstName} ! 👋</div>
        <div style={{ fontSize: 14, opacity: 0.9, fontStyle: "italic", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 12 }}>"{todayQuote}"</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>😄 Blague du jour</div>
          <div style={{ fontSize: 14, color: "#1a1a1a", lineHeight: 1.6 }}>{todayJoke}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>🚀 Navigation rapide</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["🍔","Restaurants","Vos restaurants","restaurants"],["📋","Visites","Historique","visits"],["✅","Actions","Plans d'action","actions"],["📊","Rapport","Performances","rapport"]].map(([emoji, label, desc, view]) => (
              <div key={label} onClick={() => onNavigate(view)} style={{ background: "#f9f9f9", borderRadius: 10, padding: "14px 12px", border: "1.5px solid #eee", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background="#fff0f0"; e.currentTarget.style.borderColor="#E30613"; }}
                onMouseLeave={e => { e.currentTarget.style.background="#f9f9f9"; e.currentTarget.style.borderColor="#eee"; }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>📅 Calendrier des visites</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button className="btn-icon" onClick={() => setCalDate(new Date(year, month - 1, 1))}><Icon name="back" size={16} /></button>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, textTransform: "capitalize" }}>{monthLabel}</div>
            <button className="btn-icon" onClick={() => setCalDate(new Date(year, month + 1, 1))} style={{ transform: "rotate(180deg)" }}><Icon name="back" size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#999", padding: "4px 0" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasVisit = !!visitsByDate[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const isFuture = dateStr > todayStr;
              return (
                <div key={day} onClick={() => !isFuture && setSelectedDay(isSelected ? null : dateStr)}
                  style={{ textAlign: "center", padding: "6px 2px", borderRadius: 8, cursor: isFuture ? "default" : "pointer", background: isSelected ? "#E30613" : isToday ? "#fff0f0" : "transparent", border: isToday && !isSelected ? "1.5px solid #E30613" : "1.5px solid transparent", position: "relative", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 13, fontWeight: isToday ? 800 : 400, color: isSelected ? "#fff" : isFuture ? "#ccc" : "#1a1a1a" }}>{day}</div>
                  {hasVisit && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? "#fff" : "#E30613", margin: "2px auto 0" }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      
      {selectedDay && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">{new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" })}</div>
            <span style={{ fontSize: 12, color: "#999" }}>{dayVisits.length} visite{dayVisits.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="card-body" style={{ padding: "8px 0" }}>
            {dayVisits.length === 0 && <div style={{ padding: "12px 20px", color: "#999", fontSize: 14 }}>Aucune visite ce jour</div>}
            {dayVisits.map((v, i) => {
              const rest = getRest(v.restaurantId);
              const cats = Object.entries(v.categories || {}).filter(([, val]) => val);
              return (
                <div key={v.id} style={{ padding: "10px 20px", borderBottom: i < dayVisits.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{rest?.name || "Restaurant inconnu"}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{v.consultantName} · {cats.length} catégorie{cats.length !== 1 ? "s" : ""}</div>
                  {cats.length > 0 && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{cats.map(([k]) => k).join(" · ")}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
