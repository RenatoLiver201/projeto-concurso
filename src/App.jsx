/**
 * Raiz da aplicação: estado global, persistência (localStorage + banco opcional do host), roteamento por hash, menu lateral e provider de contexto.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CircleHelp,
  FileText,
  LayoutDashboard,
  ListTree,
  Menu,
  RotateCcw,
  Settings,
  Target,
  Timer,
  X,
  UserRoundPlus,
  WandSparkles,
} from "lucide-react";
import { Onboarding } from "./components/Onboarding";
import { SessionModal } from "./components/SessionModal";
import { IconButton } from "./components/ui/Button";
import { AppContext } from "./context/AppContext";
import { createInitialState } from "./data/defaults";
import { loadWorkspace, saveWorkspace, newProfile, updateActiveState, prepareImportedBackup, mergeWorkspaceProfiles } from "./data/workspace";
import { cn } from "./lib/cn";
import { today, uid } from "./lib/dates";
import { activeTopics, dueReviews } from "./lib/planner";
import { ConcursosScreen } from "./screens/ConcursosScreen";
import { MatrixScreen } from "./screens/MatrixScreen";
import { NotebookScreen } from "./screens/NotebookScreen";
import { QuestionsScreen } from "./screens/QuestionsScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ReviewsScreen } from "./screens/ReviewsScreen";
import { ScheduleScreen } from "./screens/ScheduleScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { SimuladosScreen } from "./screens/SimuladosScreen";
import { TodayScreen } from "./screens/TodayScreen";

const NAV_ITEMS = [
  ["hoje", "Hoje", LayoutDashboard, TodayScreen],
  ["concursos", "Concursos", Target, ConcursosScreen],
  ["matriz", "Matriz", ListTree, MatrixScreen],
  ["cronograma", "Cronograma", CalendarDays, ScheduleScreen],
  ["revisoes", "Revisões", RotateCcw, ReviewsScreen],
  ["questoes", "Questões", CircleHelp, QuestionsScreen],
  ["simulados", "Simulados", Timer, SimuladosScreen],
  ["notebook", "NotebookLM", BookOpen, NotebookScreen],
  ["relatorio", "Relatório", FileText, ReportScreen],
  ["config", "Configurações", Settings, SettingsScreen],
];

const ROUTE_IDS = NAV_ITEMS.map((a) => a[0]);

const routeFromHash = () => {
  try {
    let a = location.hash.replace("#", "");
    return ROUTE_IDS.includes(a) ? a : "hoje";
  } catch {
    return "hoje";
  }
};

export default function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const activeProfile = workspace.profiles.find(p => p.id === workspace.activeProfileId) || workspace.profiles[0];
  const a = activeProfile?.state || createInitialState();
  const [route, setRoute] = useState(routeFromHash);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalSession, setModalSession] = useState(null);
  const [extraWizard, setExtraWizard] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;

  const setState = useCallback(updater => setWorkspace(prev => updateActiveState(prev, updater)), []);
  const upsert = useCallback((collection, item) => setState(prev => ({
    ...prev,
    [collection]: prev[collection].some(p => p.id === item.id)
      ? prev[collection].map(p => p.id === item.id ? item : p)
      : [...prev[collection], item],
  })), [setState]);
  const remove = useCallback((collection, id) => setState(prev => ({ ...prev, [collection]: prev[collection].filter(p => p.id !== id) })), [setState]);
  const patchSettings = useCallback(changes => setState(prev => ({ ...prev, settings: { ...prev.settings, ...changes, ...("horasDia" in changes ? { provisorio: false } : {}) } })), [setState]);
  const log = useCallback((motivo, acao) => setState(prev => ({ ...prev, decisions: [...prev.decisions, { id: uid(), data: today(), motivo, acao }] })), [setState]);
  const replaceAll = useCallback(data => setState(prepareImportedBackup(data)), [setState]);
  const nav = useCallback(next => { setRoute(next); setMobileOpen(false); try { history.replaceState(null, "", "#" + next); } catch {} window.scrollTo?.(0, 0); }, []);
  const openSession = useCallback(session => setModalSession(session || { id: null, date: today() }), []);
  const createProfile = useCallback(() => {
    const p = newProfile();
    setExtraWizard(false);
    setWorkspace(prev => ({ ...prev, profiles: [...prev.profiles, p], activeProfileId: p.id }));
    nav("hoje");
  }, [nav]);
  const switchProfile = useCallback(id => {
    setExtraWizard(false); setModalSession(null);
    setWorkspace(prev => prev.profiles.some(p => p.id === id) ? { ...prev, activeProfileId: id } : prev);
    nav("hoje");
  }, [nav]);
  const importAsProfile = useCallback(data => {
    const imported = prepareImportedBackup(data);
    const p = newProfile(`Backup importado ${today()}`, imported, true);
    setWorkspace(prev => ({ ...prev, profiles: [...prev.profiles, p], activeProfileId: p.id }));
    setExtraWizard(false);
    nav("hoje");
  }, [nav]);
  const importAllProfiles = useCallback(data => {
    setWorkspace(prev => mergeWorkspaceProfiles(prev, data));
    setExtraWizard(false);
    nav("hoje");
  }, [nav]);
  const finishWizard = useCallback(({ name, state }) => {
    setWorkspace(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === prev.activeProfileId ? { ...p, name, onboarded: true, state } : p) }));
    setExtraWizard(false);
    nav("hoje");
  }, [nav]);
  const deleteProfile = useCallback(() => {
    if (workspace.profiles.length < 2) return;
    if (!window.confirm(`Excluir o perfil “${activeProfile.name}” e todos os dados locais dele? Exporte antes um backup em Configurações.`)) return;
    setWorkspace(prev => {
      const profiles = prev.profiles.filter(p => p.id !== prev.activeProfileId);
      return { ...prev, profiles, activeProfileId: profiles[0].id };
    });
    nav("hoje");
  }, [activeProfile?.name, workspace.profiles.length, nav]);

  useEffect(() => {
    const timer = setTimeout(() => setStorageOk(saveWorkspace(workspace)), 250);
    return () => clearTimeout(timer);
  }, [workspace]);
  useEffect(() => {
    const flush = () => saveWorkspace(workspaceRef.current);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);
  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (a.settings.tema === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", a.settings.tema);
  }, [a.settings.tema]);

  const sync = useMemo(() => ({ mode: storageOk && !workspace.storageError ? "local" : "memory", last: "", error: workspace.storageError || (!storageOk ? "Falha ao salvar localmente. Exporte seu backup." : "") }), [storageOk, workspace.storageError]);
  const contextValue = useMemo(() => ({
    state: a, setState, upsert, remove, patchSettings, log, replaceAll, importAsProfile, importAllProfiles, exportWorkspace: () => workspace, nav, openSession, sync,
    profile: activeProfile, createProfile, switchProfile, deleteProfile, startWizard: () => setExtraWizard(true),
  }), [a, activeProfile, sync, setState, upsert, remove, patchSettings, log, replaceAll, importAsProfile, importAllProfiles, workspace, nav, openSession, createProfile, switchProfile, deleteProfile]);
  const ActiveScreen = NAV_ITEMS.find(item => item[0] === route)?.[3] || TodayScreen;
  const reviewCount = dueReviews(a, today()).length;
  const activeIds = new Set(a.concursos.filter(c => c.ativo).map(c => c.id));
  const overdue = a.sessions.filter(x => x.status === "planejada" && x.date && x.date < today() && (x.concursoIds || []).some(id => activeIds.has(id))).length;
  const labels = { revisoes: reviewCount, cronograma: overdue };
  const profileMenu = (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-ink2" >Perfil do estudante</label>
      <select className="h-9 w-full rounded-md border border-line2 bg-surface px-2 text-[12px]" value={activeProfile.id} onChange={e => switchProfile(e.target.value)}>
        {workspace.profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="flex gap-1">
        <button className="flex flex-1 items-center justify-center gap-1 rounded-md border border-line2 px-1 py-2 text-[11px] hover:bg-surface2" onClick={createProfile}><UserRoundPlus size={13}/> Novo perfil</button>
        <button className="flex flex-1 items-center justify-center gap-1 rounded-md border border-line2 px-1 py-2 text-[11px] hover:bg-surface2" onClick={() => setExtraWizard(true)}><WandSparkles size={13}/> Concurso guiado</button>
      </div>
    </div>
  );
  const navList = (
    <nav aria-label="Módulos" className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => nav(id)} aria-current={route === id ? "page" : undefined}
        className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium", route === id ? "bg-accentSoft text-accentInk" : "text-ink2 hover:bg-surface2 hover:text-ink")}>
        <Icon size={16} aria-hidden/><span className="flex-1">{label}</span>
        {labels[id] > 0 && <span className="rounded-full bg-warnSoft px-1.5 text-[11px] font-semibold text-warnInk">{labels[id]}</span>}
      </button>)}
    </nav>
  );
  const wizard = !activeProfile.onboarded || extraWizard;
  return <AppContext.Provider value={contextValue}>
    <div className="min-h-screen md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface md:flex">
        <div className="border-b border-line px-4 py-3">
          <p className="text-[13px] font-semibold">Preparação</p><p className="text-[11px] text-muted">Painel operacional</p>
        </div>
        <div className="border-b border-line p-3">{profileMenu}</div>
        {navList}
        <div className="mt-auto border-t border-line p-3 text-[11px] text-muted">{storageOk ? "Perfis salvos neste navegador" : "Sem armazenamento: exporte backup"}</div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2 md:hidden">
        <p className="truncate text-[13px] font-semibold">{wizard ? "Configuração do plano" : NAV_ITEMS.find(item => item[0] === route)?.[1]}</p>
        <button className="ml-auto flex items-center gap-1 text-xs text-accentInk" onClick={() => setExtraWizard(true)}><WandSparkles size={15}/> Concurso</button>
        <IconButton icon={mobileOpen ? X : Menu} label={mobileOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMobileOpen(!mobileOpen)}/>
      </header>
      {mobileOpen && <div className="border-b border-line bg-surface p-3 md:hidden">{profileMenu}{navList}</div>}
      <main className="min-w-0 px-4 py-5 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          {wizard ? <Onboarding key={`${activeProfile.id}-${extraWizard ? "add" : "initial"}`} profile={activeProfile} initialState={a} addCompetition={extraWizard && activeProfile.onboarded} onFinish={finishWizard} onCancel={activeProfile.onboarded ? () => setExtraWizard(false) : undefined}/> : <ActiveScreen key={activeProfile.id + "-" + route}/>}
        </div>
      </main>
    </div>
    {!wizard && <SessionModal s={modalSession} onClose={() => setModalSession(null)} />}
  </AppContext.Provider>;
}
