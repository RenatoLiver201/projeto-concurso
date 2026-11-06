/**
 * Persistência: localStorage (chave prep-concursos-v1) e sincronização opcional com o banco do host (window.claude).
 */
import { createInitialState } from "./defaults";

const COLLECTIONS = [
  "concursos",
  "topics",
  "sessions",
  "questions",
  "simulados",
  "notebooks",
  "decisions",
];

const STORAGE_KEY = "prep-concursos-v1";

export function loadLocalState() {
  try {
    let a = localStorage.getItem(STORAGE_KEY);
    if (!a) return null;
    let s = JSON.parse(a);
    return s && s.v === 1 ? s : null;
  } catch {
    return null;
  }
}

export function saveLocalState(a) {
  try {
    return (localStorage.setItem(STORAGE_KEY, JSON.stringify(a)), true);
  } catch {
    return false;
  }
}

export function createDbSync() {
  let a = null,
    s = {},
    t = (r) => JSON.parse(JSON.stringify(r));
  return {
    get ready() {
      return !!a;
    },
    async connect() {
      try {
        a = (await window.claude?.use?.("db")) || null;
      } catch {
        a = null;
      }
      return !!a;
    },
    async pull() {
      if (!a) return null;
      let r = createInitialState(),
        l = {
          any: false,
        },
        o = await a.doc("settings/main").get();
      o.exists &&
        ((r.settings = {
          ...r.settings,
          ...o.data(),
        }),
        (l.any = true),
        (s["settings/main"] = JSON.stringify(o.data())));
      for (let d of COLLECTIONS) {
        let u = await a.collection(d).get();
        u.empty
          ? (r[d] = [])
          : ((l.any = true),
            (r[d] = u.docs.map((L) => t(L.data()))),
            u.docs.forEach((L) => (s[d + "/" + L.id] = JSON.stringify(L.data()))));
      }
      return l.any ? r : null;
    },
    async push(r) {
      if (!a)
        return {
          ok: false,
          n: 0,
        };
      let l = 0,
        o = [],
        d = JSON.stringify(r.settings);
      s["settings/main"] !== d &&
        o.push(async () => {
          (await a.doc("settings/main").set(t(r.settings)), (s["settings/main"] = d));
        });
      for (let u of COLLECTIONS) {
        let L = new Set();
        for (let g of r[u]) {
          L.add(u + "/" + g.id);
          let m = JSON.stringify(g);
          s[u + "/" + g.id] !== m &&
            o.push(async () => {
              (await a.doc(u + "/" + g.id).set(t(g)), (s[u + "/" + g.id] = m));
            });
        }
        for (let g of Object.keys(s))
          g.startsWith(u + "/") &&
            !L.has(g) &&
            o.push(async () => {
              (await a.doc(g).delete(), delete s[g]);
            });
      }
      for (let u of o) (await u(), l++);
      return {
        ok: true,
        n: l,
      };
    },
    resetSnap() {
      s = {};
    },
  };
}
