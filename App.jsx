import React, { useState, useEffect } from "react";

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

export default function App() {
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
  const [inlineActions, setInlineActions] = useState(() => {
    const init = {};
    CATEGORIES.forEach(cat => {
      init[cat] = { isAction: visit?.inlineActions?.[cat]?.isAction || false, text: visit?.inlineActions?.[cat]?.text || "" };
    });
    return init;
  });

  const setCat = (cat, val) => setCategories(prev => ({ ...prev, [cat]: val }));
  const toggleAction = (cat) => setInlineActions(prev => ({ ...prev, [cat]: { ...prev[cat], isAction: !prev[cat].isAction } }));
  const setActionText = (cat, val) => setInlineActions(prev => ({ ...prev, [cat]: { ...prev[cat], text: val } }));
  const filledCount = CATEGORIES.filter(c => categories[c]?.trim()).length;

  const handleSave = () => { onSave({ date, categories, inlineActions }); };

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

      {filteredVisits.length === 0 && (
        <div className="empty"><div className="empty-icon"><Icon name="visit" size={40} /></div><div className="empty-text">Aucune donnée pour cette période</div></div>
      )}
    </div>
  );
}
