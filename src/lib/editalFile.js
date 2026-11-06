import { parseStructuredEdital, parseTopicLines, parseCsvTopics, suggestFromDocumentText } from "./edital.js";

/** Leitura local. PDF usa pdf.js embarcado no bundle, sem upload e sem serviço remoto. */
export async function readEditalFile(file) {
  if (!file) throw new Error("Selecione um arquivo.");
  if (file.size > 16 * 1024 * 1024) throw new Error("Arquivo acima de 16 MB; extraia o conteúdo programático e importe como texto.");
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "json") {
    const raw = await file.text();
    const parsed = parseStructuredEdital(raw);
    return { ...parsed, extractedText: raw.slice(0, 120000), format: "json" };
  }
  if (["txt", "csv", "md"].includes(ext)) {
    const raw = await file.text();
    const parsed = ext === "csv" ? parseCsvTopics(raw) : parseTopicLines(raw);
    return { ...parsed, extractedText: raw.slice(0, 120000), format: ext };
  }
  if (ext === "pdf") {
    // Carrega pdf.js sob demanda via CDN. O PDF continua local no navegador;
    // a leitura de PDF requer conexão, demais funções permanecem offline.
    const pdfModuleUrl = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
    let pdfjs;
    try { pdfjs = await import(/* @vite-ignore */ pdfModuleUrl); }
    catch { throw new Error("A leitura de PDF requer acesso à internet para carregar o leitor PDF.js. Como alternativa, importe TXT, CSV ou JSON sem conexão."); }
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = Math.min(pdf.numPages, 180);
    const chunks = [];
    for (let i = 1; i <= pages; i++) {
      const pg = await pdf.getPage(i);
      const content = await pg.getTextContent();
      let prevY = null, lines = [], line = [];
      for (const item of content.items) {
        if (!item.str) continue;
        const y = item.transform?.[5] ?? 0;
        if (prevY != null && Math.abs(y - prevY) > 3) { lines.push(line.join(" ")); line = []; }
        line.push(item.str);
        prevY = y;
      }
      if (line.length) lines.push(line.join(" "));
      chunks.push(lines.join("\n"));
    }
    const extractedText = chunks.join("\n").slice(0, 300000);
    const parsed = suggestFromDocumentText(extractedText);
    return { ...parsed, extractedText, format: "pdf", pages, totalPages: pdf.numPages };
  }
  throw new Error("Formato não aceito. Envie PDF pesquisável, TXT, CSV ou JSON estruturado.");
}
