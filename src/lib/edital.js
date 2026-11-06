/** Importação explícita e revisável: documento não é uma instrução para o aplicativo. */
const clean = (x) => String(x ?? "").replace(/\s+/g, " ").trim();
export const normalize = (x) => clean(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const topicKey = (discipline, topic) => `${normalize(discipline)}|${normalize(topic)}`;

/** Aceita uma linha por assunto: "Disciplina | Assunto"; cabeçalhos "Disciplina:" + itens. */
export function parseTopicLines(input, initialDiscipline = "") {
  let discipline = clean(initialDiscipline), rows = [], ignored = [];
  for (const [i, raw] of String(input || "").split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || /^#|^\/\//.test(line)) continue;
    const pipe = line.split(/\s*\|\s*/);
    if (pipe.length >= 2) {
      const d = clean(pipe.shift());
      const name = clean(pipe.join(" | "));
      if (d && name) rows.push({ disciplina: d, nome: name, line: i + 1 });
      else ignored.push(i + 1);
      continue;
    }
    const heading = /^(?:disciplina|mat[eé]ria)\s*:\s*(.{2,120})$/i.exec(line);
    if (heading) { discipline = clean(heading[1]); continue; }
    if (line.endsWith(":") && line.length <= 110 && !/https?:/i.test(line)) {
      discipline = clean(line.slice(0, -1)); continue;
    }
    const name = clean(line.replace(/^\s*(?:[-•–*]|(?:\d+[.)]))\s*/, ""));
    if (discipline && name) rows.push({ disciplina: discipline, nome: name, line: i + 1 });
    else ignored.push(i + 1);
  }
  const seen = new Set();
  return { rows: rows.filter(r => { const key = topicKey(r.disciplina, r.nome); if (seen.has(key)) return false; seen.add(key); return true; }), ignored };
}

export function parseStructuredEdital(raw) {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  const entries = value?.disciplinas || value?.disciplines || value?.conteudoProgramatico;
  if (!Array.isArray(entries)) throw new Error("JSON exige um array 'disciplinas' com nome e tópicos.");
  const lines = [];
  for (const item of entries) {
    const discipline = typeof item === "string" ? item : item.nome || item.disciplina;
    const topics = item.topicos || item.assuntos || item.topics || [];
    if (!discipline || !Array.isArray(topics)) continue;
    for (const t of topics) {
      const name = typeof t === "string" ? t : t?.nome || t?.assunto;
      if (name) lines.push(`${discipline} | ${name}`);
    }
  }
  const parsed = parseTopicLines(lines.join("\n"));
  return { ...parsed, meta: value.meta || {} };
}

/** Extrai SOMENTE sugestões para conferência; não inventa tópicos de um PDF arbitrário. */
export function suggestFromDocumentText(raw) {
  const text = String(raw || "");
  // Se o texto extraído contém marcadores claros de disciplina, uma sugestão é segura para revisão.
  const sections = text.split(/\r?\n/);
  if (sections.length < 2) return { rows: [], ignored: [] };
  const candidates = [];
  let current = "";
  for (const line of sections) {
    const trimmed = line.trim();
    if (/^(?:disciplina|mat[eé]ria)\s*:/i.test(trimmed)) {
      current = trimmed.replace(/^(?:disciplina|mat[eé]ria)\s*:/i, "").trim();
    } else if (current && /^[-•*]\s+\S/.test(trimmed) && trimmed.length < 350) {
      candidates.push(`${current} | ${trimmed.replace(/^[-•*]\s+/, "")}`);
    } else if (/^\S[^|]{1,90}\s\|\s\S+/.test(trimmed)) candidates.push(trimmed);
  }
  return parseTopicLines(candidates.join("\n"));
}

export function mergeEditalTopics(existing, rows, concursoId, makeTopic, sourceMeta = {}) {
  const output = [...existing];
  let added = 0, linked = 0;
  const deduped = parseTopicLines(rows.map(r => `${r.disciplina} | ${r.nome}`).join("\n")).rows;
  for (const row of deduped) {
    const key = topicKey(row.disciplina, row.nome);
    const exact = output.find(t => topicKey(t.disciplina, t.nome) === key && (t.concursos || []).includes(concursoId));
    if (exact) continue;
    // Não vincular automaticamente matérias entre concursos: legislação/cobrança podem divergir.
    const topic = makeTopic();
    output.push({ ...topic, concursos: [concursoId], disciplina: row.disciplina, nome: row.nome, provenance: sourceMeta });
    added++;
  }
  return { topics: output, added, linked };
}

/** CSV com cabeçalho disciplina;assunto, incluindo campos entre aspas. */
export function parseCsvTopics(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/,1)[0] || "";
  const delimiter = first.includes(";") ? ";" : ",";
  const rows = [];
  let cell = "", record = [], quote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quote && text[i+1] === '"') { cell += '"'; i++; }
      else quote = !quote;
    } else if (char === delimiter && !quote) { record.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quote) {
      if (char === "\r" && text[i+1] === "\n") i++;
      record.push(cell); if (record.some(x => x.trim())) rows.push(record);
      cell = ""; record = [];
    } else cell += char;
  }
  record.push(cell); if (record.some(x => x.trim())) rows.push(record);
  if (!rows.length) return { rows: [], ignored: [] };
  const header = rows[0].map(normalize);
  const dIdx = header.findIndex(x => ["disciplina", "materia", "area"].includes(x));
  const tIdx = header.findIndex(x => ["assunto", "topico", "tema", "conteudo"].includes(x));
  if (dIdx < 0 || tIdx < 0) throw new Error("CSV exige colunas 'disciplina' e 'assunto' (ou 'topico').");
  return parseTopicLines(rows.slice(1).map(r => `${r[dIdx] || ""} | ${r[tIdx] || ""}`).join("\n"));
}
