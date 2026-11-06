/**
 * Salva um arquivo para o usuário.
 *
 * - Dentro do Claude (artefato publicado) usa a capacidade "downloads" do host.
 * - Em qualquer outro ambiente (GitHub Pages, servidor próprio, localhost) faz um
 *   download normal do navegador via Blob + <a download>.
 *
 * Retorna "saved" | "declined" | "fallback" (este último = não foi possível salvar;
 * a tela de Configurações então mostra o texto para o usuário copiar).
 */
export async function saveDownload(filename, data) {
  try {
    const downloads = await window.claude?.use?.("downloads");
    if (downloads) {
      await downloads.save({ filename, data });
      return "saved";
    }
  } catch (err) {
    if (err?.code === "declined") return "declined";
  }

  try {
    const isCsv = filename.toLowerCase().endsWith(".csv");
    const payload = isCsv ? "\uFEFF" + data : data; // BOM: o Excel abre o CSV em UTF-8
    const blob = new Blob([payload], {
      type: isCsv ? "text/csv;charset=utf-8" : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return "saved";
  } catch {
    return "fallback";
  }
}

export const toCsv = (a, s) => {
  let t = (r) => {
    let l = r == null ? "" : String(r);
    return /[",;\n]/.test(l) ? `"${l.replace(/"/g, '""')}"` : l;
  };
  return [s.map((r) => r.h).join(","), ...a.map((r) => s.map((l) => t(l.f(r))).join(","))].join(`
`);
};

export function validateBackup(a) {
  if (!a || typeof a != "object" || a.v !== 1)
    return "Arquivo não reconhecido (esperado um backup deste painel, versão 1).";
  for (let s of [
    "settings",
    "concursos",
    "topics",
    "sessions",
    "questions",
    "simulados",
    "notebooks",
  ])
    if (!(s in a)) return `Campo ausente no backup: ${s}.`;
  for (let s of ["concursos", "topics", "sessions", "questions", "simulados", "notebooks"])
    if (!Array.isArray(a[s])) return `Campo inválido: ${s}.`;
  return null;
}
