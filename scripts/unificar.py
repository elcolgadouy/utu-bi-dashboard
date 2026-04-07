import pandas as pd
import sqlite3
import os

BASE_DIR = r"c:\Users\damia\Desktop\Proyecto BI"
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "utu_bi.db")

FILE_MATRICULA = os.path.join(DATA_DIR, "matricula 2018-2025.xlsx")
FILE_RESULTADOS = os.path.join(DATA_DIR, "Resultados 2018-2023 DGETP.xlsx")

def unificar_nivel(nivel):
    if pd.isna(nivel): return 'OTRO/DESCONOCIDO'
    n = str(nivel).upper()
    if 'BÁSIC' in n or 'BASICA' in n or 'C.B.' in n or 'CICLO BASICO' in n or 'FPB' in n or 'INICIAL' in n:  
        return 'EDUCACIÓN MEDIA BÁSICA'
    elif 'TERCIARI' in n or 'TECNICATURA' in n or 'C.T.T.' in n or 'INGENIER' in n or 'SUPERIOR TERCIARIA' in n:
        return 'EDUCACIÓN SUPERIOR TERCIARIA'
    elif 'PROFESIONAL' in n or 'CAPACITACI' in n or 'F.P.' in n:
        return 'FORMACIÓN PROFESIONAL Y CAPACITACIONES'
    else:
        return 'EDUCACIÓN MEDIA SUPERIOR'

def process():
    print("Iniciando procesamiento de datos...")

    print("Cargando base de matrícula...")
    cols_mat = ['ACuALe', 'NivCod', 'NivDes', 'DepCod', 'DepDes', 'EscCod', 'BDAluID']
    df_mat = pd.read_excel(FILE_MATRICULA, usecols=cols_mat)
    
    # Casteo numérico seguro para evitar errores en joins
    for col in ['ACuALe', 'NivCod', 'DepCod']:
        df_mat[col] = pd.to_numeric(df_mat[col], errors='coerce')
    
    # 1. Mapear Departamentos Faltantes
    dep_map = df_mat.dropna(subset=['DepDes']).drop_duplicates(subset=['EscCod']).set_index('EscCod')['DepDes'].to_dict()
    df_mat['DepDes'] = df_mat['DepDes'].fillna(df_mat['EscCod'].map(dep_map))
    df_mat['DepDes'] = df_mat['DepDes'].str.strip().str.title()
    
    # 2. Mapear Niveles
    df_mat['NivDes_Limpio'] = df_mat['NivDes'].apply(unificar_nivel)

    print("Agrupando matrícula...")
    agg_mat = df_mat.groupby(['ACuALe', 'NivCod', 'NivDes_Limpio', 'DepCod', 'DepDes']).agg(
        total_matricula=('BDAluID', 'count')
    ).reset_index()

    print("Cargando base de resultados...")
    # Lambda en usecols lee solo las columnas que el dataframe tenga, evitando excepciones
    desired_cols = {'ACuALe', 'NivCod', 'DepCod', 'EscCod', 'indiMonitor', 'reuFIN'}
    df_res = pd.read_excel(FILE_RESULTADOS, usecols=lambda c: c in desired_cols)

    if 'indiMonitor' not in df_res.columns: df_res['indiMonitor'] = pd.NA
    if 'reuFIN' not in df_res.columns: df_res['reuFIN'] = pd.NA
    
    # Coalesce (unificar ambas en una sola medida de aprobación)
    df_res['indicador_aprobacion'] = df_res['indiMonitor'].fillna(df_res['reuFIN'])

    for col in ['ACuALe', 'NivCod', 'DepCod']:
        if col in df_res.columns:
            df_res[col] = pd.to_numeric(df_res[col], errors='coerce')

    # Propagar Nombres de nivel y departamento hacia Resultados ANTES de agrupar para no perderlos si outer join falla
    dict_niv = df_mat.dropna(subset=['NivDes_Limpio']).drop_duplicates('NivCod').set_index('NivCod')['NivDes_Limpio'].to_dict()
    dict_dep = df_mat.dropna(subset=['DepDes']).drop_duplicates('DepCod').set_index('DepCod')['DepDes'].to_dict()
    
    df_res['NivDes_Limpio'] = df_res['NivCod'].map(dict_niv).fillna('OTRO/DESCONOCIDO')
    df_res['DepDes'] = df_res['DepCod'].map(dict_dep).fillna('Desconocido')

    print("Agrupando resultados...")
    agg_res = df_res.groupby(['ACuALe', 'NivCod', 'NivDes_Limpio', 'DepCod', 'DepDes']).agg(
        total_evaluados=('indicador_aprobacion', 'count'),
        aprobados=('indicador_aprobacion', lambda x: (x == 1).sum())
    ).reset_index()

    print("Unificando bases...")
    df_final = pd.merge(
        agg_mat, 
        agg_res, 
        on=['ACuALe', 'NivCod', 'NivDes_Limpio', 'DepCod', 'DepDes'], 
        how='outer'
    )

    df_final['tasa_aprobacion'] = (df_final['aprobados'] / df_final['total_evaluados']).fillna(0)
    df_final = df_final.fillna(0)

    df_final.columns = ['anio', 'niv_cod', 'niv_des', 'dep_cod', 'dep_des', 'matricula', 'evaluados', 'aprobados', 'tasa_aprobacion']

    # Filtramos donde anio o niv_des sea vacío (0 por el fillna)
    df_final = df_final[df_final['niv_des'] != 0]
    df_final = df_final[df_final['anio'] > 2000] # Limpiar basura

    print(f"Guardando en {DB_PATH}... (Total {len(df_final)} filas)")
    conn = sqlite3.connect(DB_PATH)
    df_final.to_sql('bi_unificado', conn, if_exists='replace', index=False)
    conn.close()

    print("--- Proceso completado con éxito ---")

if __name__ == "__main__":
    process()
