"""
SQLite database service (local-only replacement for MongoDB/Motor).
All data lives in resume_tailor.db next to main.py.
"""

import json
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import aiosqlite

logger = logging.getLogger(__name__)

DB_PATH = os.getenv("DB_PATH", "resume_tailor.db")
LOCAL_USER_ID = "local"

_CREATE_PROFILES = """
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    data    TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
)
"""

_CREATE_TAILORED_RESUMES = """
CREATE TABLE IF NOT EXISTS tailored_resumes (
    id               TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    job_title        TEXT,
    company          TEXT,
    jd_text          TEXT,
    jd_analysis      TEXT,
    tailored_profile TEXT,
    source_map       TEXT,
    flagged_claims   TEXT,
    gap_report       TEXT,
    match_score      REAL DEFAULT 0,
    status           TEXT DEFAULT 'draft',
    created_at       TEXT DEFAULT (datetime('now')),
    approved_at      TEXT,
    ats_score_data   TEXT
)
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(_CREATE_PROFILES)
        await db.execute(_CREATE_TAILORED_RESUMES)
        # Safe migration: add column if table predates this version
        try:
            await db.execute("ALTER TABLE tailored_resumes ADD COLUMN ats_score_data TEXT")
        except Exception:
            pass
        await db.commit()
    logger.info("SQLite database ready at %s", DB_PATH)


# ---------------------------------------------------------------------------
# Profile CRUD
# ---------------------------------------------------------------------------

async def get_profile(user_id: str) -> Optional[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM profiles WHERE user_id = ?", (user_id,)
        ) as cur:
            row = await cur.fetchone()
    if row is None:
        return None
    data = json.loads(row["data"])
    data["user_id"] = row["user_id"]
    data["updated_at"] = row["updated_at"]
    return data


async def upsert_profile(user_id: str, profile_data: Dict) -> Dict:
    data = {k: v for k, v in profile_data.items() if k not in ("user_id", "updated_at")}
    now = datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO profiles (user_id, data, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE
              SET data = excluded.data, updated_at = excluded.updated_at
            """,
            (user_id, json.dumps(data), now),
        )
        await db.commit()
    return await get_profile(user_id)


async def patch_profile_section(user_id: str, section: str, section_data: Any) -> Dict:
    existing = await get_profile(user_id) or {}
    existing.pop("user_id", None)
    existing.pop("updated_at", None)
    existing[section] = section_data
    return await upsert_profile(user_id, existing)


async def add_project_to_profile(user_id: str, project: Dict) -> Dict:
    existing = await get_profile(user_id) or {}
    existing.pop("user_id", None)
    existing.pop("updated_at", None)
    projects = existing.get("projects", [])
    projects.append(project)
    existing["projects"] = projects
    return await upsert_profile(user_id, existing)


# ---------------------------------------------------------------------------
# Tailored resume CRUD
# ---------------------------------------------------------------------------

def _row_to_resume(row) -> Dict:
    ats_raw = dict(row).get("ats_score_data")
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "job_title": row["job_title"],
        "company": row["company"],
        "jd_text": row["jd_text"],
        "jd_analysis": json.loads(row["jd_analysis"] or "{}"),
        "tailored_profile": json.loads(row["tailored_profile"] or "{}"),
        "source_map": json.loads(row["source_map"] or "[]"),
        "flagged_claims": json.loads(row["flagged_claims"] or "[]"),
        "gap_report": json.loads(row["gap_report"] or "[]"),
        "match_score": row["match_score"] or 0,
        "status": row["status"],
        "created_at": row["created_at"],
        "approved_at": row["approved_at"],
        "ats_score": json.loads(ats_raw) if ats_raw else None,
    }


async def create_tailored_resume(resume_data: Dict) -> Dict:
    rid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """
            INSERT INTO tailored_resumes
              (id, user_id, job_title, company, jd_text, jd_analysis,
               tailored_profile, source_map, flagged_claims, gap_report,
               match_score, status, created_at, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rid,
                resume_data.get("user_id"),
                resume_data.get("job_title"),
                resume_data.get("company"),
                resume_data.get("jd_text"),
                json.dumps(resume_data.get("jd_analysis", {})),
                json.dumps(resume_data.get("tailored_profile", {})),
                json.dumps(resume_data.get("source_map", [])),
                json.dumps(resume_data.get("flagged_claims", [])),
                json.dumps(resume_data.get("gap_report", [])),
                resume_data.get("match_score", 0),
                resume_data.get("status", "draft"),
                now,
                None,
            ),
        )
        await db.commit()
    return await get_tailored_resume(rid, resume_data.get("user_id"))


async def get_tailored_resume(resume_id: str, user_id: str) -> Optional[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM tailored_resumes WHERE id = ? AND user_id = ?",
            (resume_id, user_id),
        ) as cur:
            row = await cur.fetchone()
    return _row_to_resume(row) if row else None


async def list_tailored_resumes(user_id: str) -> List[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT * FROM tailored_resumes
               WHERE user_id = ? AND status != 'archived'
               ORDER BY created_at DESC""",
            (user_id,),
        ) as cur:
            rows = await cur.fetchall()
    return [_row_to_resume(r) for r in rows]


async def save_ats_score(resume_id: str, user_id: str, ats_data: Dict) -> Optional[Dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE tailored_resumes SET ats_score_data = ? WHERE id = ? AND user_id = ?",
            (json.dumps(ats_data), resume_id, user_id),
        )
        await db.commit()
    return await get_tailored_resume(resume_id, user_id)


async def update_tailored_resume_status(
    resume_id: str, user_id: str, status: str, extra: Optional[Dict] = None
) -> Optional[Dict]:
    sets = ["status = ?"]
    params: list = [status]
    if extra and "approved_at" in extra:
        sets.append("approved_at = ?")
        val = extra["approved_at"]
        if isinstance(val, datetime):
            val = val.isoformat()
        params.append(val)
    params += [resume_id, user_id]
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            f"UPDATE tailored_resumes SET {', '.join(sets)} WHERE id = ? AND user_id = ?",
            params,
        )
        await db.commit()
    return await get_tailored_resume(resume_id, user_id)
