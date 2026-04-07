from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import sqlite3
import pandas as pd
import os

app = FastAPI(title="UTU BI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = r"c:\Users\damia\Desktop\Proyecto BI\data\utu_bi.db"

def get_db_conn():
    return sqlite3.connect(DB_PATH)

def build_where_clause(year, level, dept):
    conditions = []
    params = []
    if year and year != 'Todos':
        conditions.append("anio = ?")
        params.append(year)
    if level and level != 'Todos los niveles':
        conditions.append("niv_des = ?")
        params.append(level)
    if dept: # Text search for department
        conditions.append("dep_des LIKE ?")
        params.append(f"%{dept}%")
        
    where_sql = " AND ".join(conditions) if conditions else ""
    if where_sql:
        where_sql = " WHERE " + where_sql
    return where_sql, params

@app.get("/filters")
def get_filters():
    conn = get_db_conn()
    df = pd.read_sql("SELECT DISTINCT anio, niv_des, dep_des FROM bi_unificado", conn)
    conn.close()
    return {
        "years": sorted([int(y) for y in df['anio'].dropna().unique() if pd.notna(y)]),
        "levels": sorted(df['niv_des'].dropna().unique().tolist()),
        "departments": sorted([d for d in df['dep_des'].dropna().unique().tolist() if isinstance(d, str)])
    }

@app.get("/metrics/enrollment/trends")
def get_enrollment_trends(year: str = None, level: str = None, dept: str = None):
    conn = get_db_conn()
    where_sql, params = build_where_clause(None, level, dept) # Always show all years for trends unless you want point-in-time
    query = f"SELECT anio, SUM(matricula) as total FROM bi_unificado {where_sql} GROUP BY anio ORDER BY anio"
    df = pd.read_sql(query, conn, params=params)
    conn.close()
    return df.to_dict(orient="records")

@app.get("/metrics/enrollment/levels")
def get_enrollment_by_level(year: str = None, level: str = None, dept: str = None):
    conn = get_db_conn()
    where_sql, params = build_where_clause(year, None, dept) # Always group by all levels, to contrast
    query = f"SELECT niv_des, SUM(matricula) as total FROM bi_unificado {where_sql} GROUP BY niv_des ORDER BY total DESC"
    df = pd.read_sql(query, conn, params=params)
    conn.close()
    return df.to_dict(orient="records")

@app.get("/metrics/approval/overview")
def get_approval_overview(year: str = None, level: str = None, dept: str = None):
    conn = get_db_conn()
    where_sql, params = build_where_clause(year, level, dept)
    query = f"SELECT SUM(matricula) as matricula, SUM(evaluados) as evaluados, SUM(aprobados) as aprobados FROM bi_unificado {where_sql}"
    df = pd.read_sql(query, conn, params=params)
    conn.close()
    
    if df.empty or pd.isna(df['matricula'].iloc[0]):
        return {"matricula": 0, "evaluados": 0, "aprobados": 0, "tasa": 0}
        
    row = df.iloc[0]
    tasa = row['aprobados'] / row['evaluados'] if row['evaluados'] > 0 else 0
    return {
        "matricula": int(row['matricula']), 
        "evaluados": int(row['evaluados']), 
        "aprobados": int(row['aprobados']), 
        "tasa": float(tasa)
    }

# ESTO INDICA A PYTHON QUE SIRVA LA APLICACIÓN REACT SI NO SE LLAMA A UNA API
import os
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
