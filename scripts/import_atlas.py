#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import shutil
import unicodedata
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


VAULT_ROOT = Path("/home/nlaoue/Documents/LeFort")
SOURCE_ROOT = VAULT_ROOT / "30 - Atlas"
ATTACHMENT_ROOTS = [
    VAULT_ROOT / "00 - System" / "Attachments",
    VAULT_ROOT / "Attachements",
]
REPO_ROOT = Path("/home/nlaoue/dev/naatyu.github.io")
DOCS_ROOT = REPO_ROOT / "docs"
ATTACHMENTS_OUT = REPO_ROOT / "static" / "attachments"

GENERIC_ASSET_PREFIXES = (
    "pasted image",
    "screenshot_",
    "image",
    "img_",
    "1_",
)

CALL_OUT_TITLES = {
    "abstract": "Summary",
    "info": "Info",
    "tip": "Tip",
    "note": "Note",
    "warning": "Warning",
}

ACRONYMS = {
    "ai": "AI",
    "nlp": "NLP",
    "llm": "LLM",
    "fp8": "FP8",
    "gdb": "GDB",
    "dns": "DNS",
    "cap": "CAP",
}


@dataclass
class NoteInfo:
    source_path: Path
    source_rel: Path
    target_rel: Path
    title: str
    route: str
    created: str
    lastmod: str
    tags: list[str]


def slugify(value: str) -> str:
    value = value.replace("&", " and ")
    value = value.replace("'", "")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value).strip("-")
    return value or "note"


def pretty_label(value: str) -> str:
    parts = value.split("-")
    rendered = []
    for part in parts:
        rendered.append(ACRONYMS.get(part, part.capitalize()))
    return " ".join(rendered)


def normalize_lookup(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def split_frontmatter(text: str) -> tuple[dict[str, object], str]:
    text = text.lstrip()
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---", 4)
    if end == -1:
        return {}, text
    raw = text[4:end].strip()
    body = text[end + 4 :]
    meta: dict[str, object] = {}
    for line in raw.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if value.startswith("[") and value.endswith("]"):
            items = [item.strip().strip('"').strip("'") for item in value[1:-1].split(",") if item.strip()]
            meta[key] = items
        else:
            meta[key] = value
    return meta, body.lstrip("\n")


def first_heading(body: str) -> str | None:
    for line in body.splitlines():
        match = re.match(r"^#\s+(.+?)\s*$", line.strip())
        if match:
            return match.group(1).strip()
    return None


def date_string(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")


def remove_title_heading(body: str, title: str) -> str:
    lines = body.splitlines()
    idx = 0
    while idx < len(lines) and not lines[idx].strip():
        idx += 1
    if (
        idx + 1 < len(lines)
        and re.fullmatch(r"[a-z]{1,3}", lines[idx].strip())
        and re.match(r"^#\s+(.+?)\s*$", lines[idx + 1].strip())
    ):
        idx += 1
    if idx < len(lines):
        match = re.match(r"^#\s+(.+?)\s*$", lines[idx].strip())
        if match and normalize_lookup(match.group(1)) == normalize_lookup(title):
            lines = lines[:idx] + lines[idx + 1 :]
    return "\n".join(lines).lstrip("\n")


def convert_callouts(text: str) -> str:
    lines = text.splitlines()
    output: list[str] = []
    i = 0
    while i < len(lines):
        match = re.match(r"^\s*>?\s*\[!(\w+)\]\s*(.*)$", lines[i])
        if not match:
            output.append(lines[i])
            i += 1
            continue
        callout_type = match.group(1).lower()
        title = match.group(2).strip() or CALL_OUT_TITLES.get(callout_type, callout_type.capitalize())
        level = "##" if callout_type == "abstract" else "###"
        collected: list[str] = []
        i += 1
        while i < len(lines):
            if re.match(r"^\s*>\s?", lines[i]):
                collected.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
                continue
            if not lines[i].strip():
                collected.append("")
                i += 1
                continue
            break
        output.append(f"{level} {title}")
        output.append("")
        while collected and not collected[-1].strip():
            collected.pop()
        output.extend(collected or [""])
    return "\n".join(output)


def convert_glossary_lines(text: str) -> str:
    converted = []
    for line in text.splitlines():
        match = re.match(r"^\*([^*]+)\*\s*-\s*(.+)$", line.strip())
        if match:
            converted.append(f"- **{match.group(1).strip()}:** {match.group(2).strip()}")
        else:
            converted.append(line)
    return "\n".join(converted)


def protect_segments(text: str) -> tuple[str, dict[str, str]]:
    placeholders: dict[str, str] = {}

    def stash(pattern: str, current: str, prefix: str) -> str:
        counter = len(placeholders)

        def repl(match: re.Match[str]) -> str:
            nonlocal counter
            key = f"@@{prefix}{counter}@@"
            placeholders[key] = match.group(0)
            counter += 1
            return key

        return re.sub(pattern, repl, current, flags=re.DOTALL | re.MULTILINE)

    text = stash(r"```.*?```", text, "CODE")
    text = stash(r"\$\$.*?\$\$", text, "MATHBLOCK")
    text = stash(r"(?<!\$)\$(?!\$)(?:\\.|[^$\n])+\$(?!\$)", text, "MATHINLINE")
    return text, placeholders


def restore_segments(text: str, placeholders: dict[str, str]) -> str:
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


def escape_mdx_text(text: str) -> str:
    protected, placeholders = protect_segments(text)
    protected = protected.replace("{", "\\{").replace("}", "\\}")
    protected = re.sub(r"(?<!\\)<", "&lt;", protected)
    protected = re.sub(r"(?<!\\)>", "&gt;", protected)
    return restore_segments(protected, placeholders)


def cleanup_spacing(text: str) -> str:
    text = text.replace("\x0c", "\\f")
    text = text.replace("\x08", "\\b")
    text = text.replace("\x09", "\\t")
    text = re.sub(r"[\x00-\x07\x0b-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def resolve_asset(ref: str) -> Path | None:
    ref = ref.strip()
    direct = VAULT_ROOT / ref
    if direct.exists():
        return direct
    rel = SOURCE_ROOT / ref
    if rel.exists():
        return rel
    basename = Path(ref).name
    for root in ATTACHMENT_ROOTS:
        candidate = root / basename
        if candidate.exists():
            return candidate
        candidate = root / ref
        if candidate.exists():
            return candidate
    return None


def asset_name(original_name: str, note_slug: str, index: int) -> str:
    stem = Path(original_name).stem
    ext = Path(original_name).suffix.lower()
    lowered = stem.lower()
    if lowered.startswith(GENERIC_ASSET_PREFIXES):
        return f"{note_slug}-{index:02d}{ext}"
    return f"{slugify(stem)}{ext}"


def to_title_case_sentence(value: str) -> str:
    value = value.replace("-", " ")
    return value[:1].upper() + value[1:]


def write_category_files(directory_labels: dict[Path, str]) -> None:
    for directory, label in directory_labels.items():
        out_dir = DOCS_ROOT / directory
        out_dir.mkdir(parents=True, exist_ok=True)
        category_file = out_dir / "_category_.json"
        category_file.write_text(json.dumps({"label": label}, indent=2) + "\n")


def main() -> None:
    all_sources = sorted(SOURCE_ROOT.rglob("*.md"))
    lookup: dict[str, NoteInfo] = {}
    directory_labels: dict[Path, str] = {}
    notes: list[NoteInfo] = []

    for source_path in all_sources:
        source_rel = source_path.relative_to(SOURCE_ROOT)
        target_parts = [slugify(part) for part in source_rel.parts[:-1]]
        target_file = slugify(source_rel.stem) + ".md"
        target_rel = Path(*target_parts, target_file)

        meta, body = split_frontmatter(source_path.read_text())
        title = str(meta.get("title") or first_heading(body) or source_rel.stem)
        created = str(meta.get("created") or meta.get("date") or date_string(source_path))
        lastmod = date_string(source_path)
        tags = meta.get("tags")
        if isinstance(tags, list):
            tags_list = [str(tag) for tag in tags]
        else:
            tags_list = []
        route = "/atlas/" + target_rel.with_suffix("").as_posix()

        note = NoteInfo(
            source_path=source_path,
            source_rel=source_rel,
            target_rel=target_rel,
            title=title,
            route=route,
            created=created,
            lastmod=lastmod,
            tags=tags_list,
        )
        notes.append(note)
        for candidate in {title, source_rel.stem}:
            key = normalize_lookup(candidate)
            if key and key not in lookup:
                lookup[key] = note
        for index, (source_part, _) in enumerate(zip(source_rel.parts[:-1], target_rel.parts[:-1]), start=1):
            prefix = Path(*target_rel.parts[:index])
            directory_labels[prefix] = pretty_label(slugify(source_part))

    for path in DOCS_ROOT.iterdir():
        if path.name == "intro.md":
            continue
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink()
    if ATTACHMENTS_OUT.exists():
        shutil.rmtree(ATTACHMENTS_OUT)
    ATTACHMENTS_OUT.mkdir(parents=True, exist_ok=True)

    for note in notes:
        meta, body = split_frontmatter(note.source_path.read_text())
        body = remove_title_heading(body, note.title)
        body = convert_callouts(body)
        body = convert_glossary_lines(body)

        note_slug = note.target_rel.stem
        note_attach_dir = ATTACHMENTS_OUT / note.target_rel.parent / note_slug
        note_attach_dir.mkdir(parents=True, exist_ok=True)
        copied_assets: dict[Path, str] = {}
        asset_counter = 1

        def replace_image(match: re.Match[str]) -> str:
            nonlocal asset_counter
            ref = match.group(1).strip()
            source_asset = resolve_asset(ref)
            if source_asset is None:
                return f"*Missing asset: {Path(ref).name}*"
            if source_asset not in copied_assets:
                out_name = asset_name(source_asset.name, note_slug, asset_counter)
                while (note_attach_dir / out_name).exists():
                    asset_counter += 1
                    out_name = asset_name(source_asset.name, note_slug, asset_counter)
                shutil.copy2(source_asset, note_attach_dir / out_name)
                copied_assets[source_asset] = out_name
                asset_counter += 1
            out_name = copied_assets[source_asset]
            alt = to_title_case_sentence(Path(out_name).stem.replace(note_slug, note.title))
            attach_rel = (note.target_rel.parent / note_slug / out_name).as_posix()
            return f"![{alt}](/attachments/{attach_rel})"

        body = re.sub(r"!\[\[([^\]]+)\]\]", replace_image, body)

        def replace_wikilink(match: re.Match[str]) -> str:
            raw = match.group(1).strip()
            target_name, alias = (raw.split("|", 1) + [None])[:2]
            target_name = target_name.strip()
            label = (alias or target_name).strip()
            target = lookup.get(normalize_lookup(target_name))
            if target is None:
                return label
            return f"[{label}]({target.route})"

        body = re.sub(r"\[\[([^\]]+)\]\]", replace_wikilink, body)
        body = escape_mdx_text(body)
        body = cleanup_spacing(body)

        frontmatter = [
            "---",
            f'title: "{note.title.replace(chr(34), chr(92) + chr(34))}"',
            f"date: {note.created}",
            f"lastmod: {note.lastmod}",
        ]
        if note.tags:
            frontmatter.append("tags:")
            frontmatter.extend(f"  - {tag}" for tag in note.tags)
        frontmatter.append("draft: false")
        frontmatter.append("---")
        content = "\n".join(frontmatter) + "\n\n" + body

        out_path = DOCS_ROOT / note.target_rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(content)

    write_category_files(directory_labels)


if __name__ == "__main__":
    main()
