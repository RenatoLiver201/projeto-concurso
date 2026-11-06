#!/usr/bin/env python3
"""Inspeciona sem alterar o Painel de Concursos entregue pelo usuario.

Uso: python verificar_base.py CAMINHO_DA_RAIZ_DO_PROJETO
     python verificar_base.py # inspeciona diretório atual

A saída reflete apenas compatibilidade estrutural, NAO garante testes funcionais.
"""
import json
import pathlib
import sys

FILES = [
    "package.json", "src/App.jsx", "src/data/defaults.js",
    "src/data/storage.js", "src/lib/planner.js", "src/lib/backup.js",
    "src/screens/TodayScreen.jsx", "src/screens/ConcursosScreen.jsx",
    "src/screens/MatrixScreen.jsx", "src/screens/ScheduleScreen.jsx",
    "src/screens/ReviewsScreen.jsx", "src/screens/QuestionsScreen.jsx",
    "src/screens/SimuladosScreen.jsx", "src/screens/NotebookScreen.jsx",
    "src/screens/ReportScreen.jsx", "src/screens/SettingsScreen.jsx",
]


def main():
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    print(f"Base verificada (somente leitura): {root}")
    missing = [p for p in FILES if not (root / p).is_file()]
    for p in missing:
        print(f"ERRO: falta {p}")
    if missing:
        return 1
    try:
        package = json.loads((root / "package.json").read_text(encoding="utf-8"))
        print("Aplicação:", package.get("name", "(sem nome)"))
        print("Comandos:", ", ".join(package.get("scripts", {}).keys()))
    except (ValueError, OSError) as exc:
        print("ERRO: package.json inválido:", exc)
        return 1
    files = {
        key: (root / f).read_text(encoding="utf-8")
        for key, f in (
            ("defaults", "src/data/defaults.js"),
            ("planner", "src/lib/planner.js"),
            ("storage", "src/data/storage.js"),
            ("questions", "src/screens/QuestionsScreen.jsx"),
        )
    }
    print("Arquivos-base: OK (10 telas + núcleo)")
    for title, cond in [
        ("seed CGU encontrado; tornar opcional/remover do boot", 'concursoPrincipal: "cgu"' in files["defaults"]),
        ("CGU/SEFAZ-DF/SES-DF/BACEN cadastrados inicialmente", "function defaultConcursos" in files["defaults"]),
        ("seed de Ciência de Dados no ciclo", "Ciência de Dados" in files["defaults"]),
        ("store legado v1 único encontrado", "prep-concursos-v1" in files["storage"]),
        ("planner percorre matriz global; auditar filtros", "for (let f of r)" in files["planner"]),
        ("tela de questões possui regra C/E fixa; revisar", "regra Cebraspe" in files["questions"]),
    ]:
        print(("REVISAR" if cond else "OK ou refatorado") + ": " + title)
    print("Próximo passo: implementar mudanças, rodar build e checklist de aceitação.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
