/** Perfis independentes; preserva o original v1 sem sobrescrevê-lo. */
import { createInitialState } from "./defaults.js";
import { uid } from "../lib/dates.js";

export const WORKSPACE_KEY = "prep-concursos-workspace-v2";
export const LEGACY_KEY = "prep-concursos-v1";
export const COLLECTIONS = ["concursos", "topics", "sessions", "questions", "simulados", "notebooks", "decisions"];
export const validState = (data) => Boolean(data && data.v === 1 && data.settings && COLLECTIONS.every(k => Array.isArray(data[k])));
export const cleanState = (data) => ({ ...createInitialState(), ...data, settings: { ...createInitialState().settings, ...(data?.settings || {}) } });

export function newProfile(name = "Novo estudante", state = createInitialState(), onboarded = false) {
  return { id: uid(), name: name.trim().slice(0, 100) || "Novo estudante", createdAt: new Date().toISOString(), onboarded, state: cleanState(state) };
}
export function emptyWorkspace() {
  const p = newProfile();
  return { version: 2, activeProfileId: p.id, profiles: [p] };
}
export function loadWorkspace(storage = localStorage) {
  try {
    const raw = storage.getItem(WORKSPACE_KEY);
    if (raw) {
      const doc = JSON.parse(raw);
      if (doc.version === 2 && Array.isArray(doc.profiles) && doc.profiles.length && doc.profiles.every(p => p.id && validState(p.state))) {
        return { version: 2, activeProfileId: doc.profiles.some(p => p.id === doc.activeProfileId) ? doc.activeProfileId : doc.profiles[0].id, profiles: doc.profiles.map(p => ({ ...p, state: cleanState(p.state) })) };
      }
      // Não sobrescrever um workspace ilegível.
      return { ...emptyWorkspace(), storageError: "Workspace salvo inválido: exporte uma cópia do armazenamento antes de prosseguir." };
    }
    const legacyRaw = storage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (validState(legacy)) {
        const p = newProfile("Meu histórico original", legacy, true);
        return { version: 2, activeProfileId: p.id, profiles: [p], migratedFromV1: true };
      }
      return { ...emptyWorkspace(), storageError: "Backup antigo não reconhecido. O original foi preservado." };
    }
  } catch {
    return { ...emptyWorkspace(), storageError: "Falha ao acessar o armazenamento local. Seus arquivos anteriores não foram alterados." };
  }
  return emptyWorkspace();
}
export function saveWorkspace(workspace, storage = localStorage) {
  try {
    if (workspace.storageError) return false; // proteção contra sobrescrita de dados ilegíveis
    storage.setItem(WORKSPACE_KEY, JSON.stringify({ version: 2, activeProfileId: workspace.activeProfileId, profiles: workspace.profiles }));
    return true;
  } catch { return false; }
}
export function updateActiveState(workspace, updater) {
  return { ...workspace, profiles: workspace.profiles.map(p => p.id === workspace.activeProfileId ? { ...p, state: cleanState(typeof updater === "function" ? updater(p.state) : updater) } : p) };
}
export function prepareImportedBackup(data) {
  if (!validState(data)) throw new Error("Backup antigo inválido. É necessário um JSON versão 1 com coleções e configurações.");
  return cleanState(data);
}

/** Valida backups v2 e importa perfis sem substituir os existentes. */
export function validateWorkspaceBackup(doc) {
  if (!doc || doc.version !== 2 || !Array.isArray(doc.profiles) || !doc.profiles.length) return false;
  return doc.profiles.every(p => p?.id && validState(p.state));
}
export function mergeWorkspaceProfiles(current, imported) {
  if (!validateWorkspaceBackup(imported)) throw new Error("Backup de perfis v2 inválido.");
  const newcomers = imported.profiles.map(p => ({ ...p, id: uid(), name: `${p.name || "Estudante"} (importado)`, state: cleanState(p.state) }));
  return { ...current, activeProfileId: newcomers[0].id, profiles: [...current.profiles, ...newcomers] };
}
