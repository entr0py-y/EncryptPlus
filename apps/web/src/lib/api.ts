export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ScanRecord {
  id: number;
  project_id?: number | null;
  repository_url: string;
  branch?: string | null;
  status: string;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
  files_scanned: number;
  lines_scanned: number;
  scan_duration_ms: number;
  overall_risk_score?: number | null;
  overall_risk_level?: string | null;
  pqc_readiness_score?: number | null;
  pqc_readiness_level?: string | null;
  migration_readiness_score?: number | null;
  migration_readiness_level?: string | null;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  quantum_vulnerable_count: number;
  quantum_safe_count: number;
  quantum_partial_count: number;
  pqc_count: number;
  hybrid_count: number;
}

export interface CryptoAssetRecord {
  id: number;
  scan_id: number;
  asset_type: string;
  algorithm?: string | null;
  category?: string | null;
  primitive?: string | null;
  key_size?: number | null;
  mode?: string | null;
  language?: string | null;
  file_path?: string | null;
  line_start?: number | null;
  column?: number | null;
  match_text?: string | null;
  context?: string | null;
  source_context_json?: string | null;
  finding_type?: string | null;
  file_type?: string | null;
  confidence?: string | null;
  purpose?: string | null;
  quantum_status?: string | null;
  migration_status?: string | null;
  severity: string;
  data_sensitivity?: string | null;
  data_lifetime?: string | null;
  migration_time?: string | null;
  business_criticality?: string | null;
  risk_score?: number | null;
  risk_level?: string | null;
  mosca_risk?: string | null;
  description?: string | null;
  remediation?: string | null;
  impact?: string | null;
  effort?: string | null;
  references_json?: string | null;
  tags_json?: string | null;
  oid?: string | null;
  cryptoscan_id?: string | null;
  created_at: string;
}

export async function fetchScans(): Promise<ScanRecord[]> {
  const res = await fetch(`${API_URL}/api/scans`);
  if (!res.ok) throw new Error('Failed to fetch scans');
  return res.json();
}

export async function fetchScan(id: string | number): Promise<ScanRecord> {
  const res = await fetch(`${API_URL}/api/scans/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch scan ${id}`);
  return res.json();
}

export async function fetchScanSummary(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/summary`);
  if (!res.ok) throw new Error('Failed to fetch scan summary');
  return res.json();
}

export async function fetchScanInventory(id: string | number, params?: { asset_type?: string; severity?: string; quantum_status?: string }): Promise<CryptoAssetRecord[]> {
  let url = `${API_URL}/api/scans/${id}/inventory`;
  if (params) {
    const q = new URLSearchParams();
    if (params.asset_type) q.set('asset_type', params.asset_type);
    if (params.severity) q.set('severity', params.severity);
    if (params.quantum_status) q.set('quantum_status', params.quantum_status);
    const qs = q.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch scan inventory');
  return res.json();
}

export async function fetchScanFindings(id: string | number): Promise<CryptoAssetRecord[]> {
  const res = await fetch(`${API_URL}/api/scans/${id}/findings`);
  if (!res.ok) throw new Error('Failed to fetch scan findings');
  return res.json();
}

export async function fetchAsset(id: string | number, assetId: string | number): Promise<CryptoAssetRecord> {
  const res = await fetch(`${API_URL}/api/scans/${id}/assets/${assetId}`);
  if (!res.ok) throw new Error('Failed to fetch asset');
  return res.json();
}

export async function fetchAlgorithms(id: string | number): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/api/scans/${id}/algorithms`);
  if (!res.ok) throw new Error('Failed to fetch algorithms');
  return res.json();
}

export async function fetchRisk(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/risk`);
  if (!res.ok) throw new Error('Failed to fetch risk');
  return res.json();
}

export async function fetchQuantum(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/quantum`);
  if (!res.ok) throw new Error('Failed to fetch quantum');
  return res.json();
}

export async function fetchMosca(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/mosca`);
  if (!res.ok) throw new Error('Failed to fetch mosca');
  return res.json();
}

export async function fetchCompliance(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/compliance`);
  if (!res.ok) throw new Error('Failed to fetch compliance');
  return res.json();
}

export async function fetchRecommendations(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function fetchScores(id: string | number): Promise<Record<string, number>> {
  const res = await fetch(`${API_URL}/api/scans/${id}/scores`);
  if (!res.ok) throw new Error('Failed to fetch scores');
  return res.json();
}

export async function fetchScanReport(id: string | number) {
  const res = await fetch(`${API_URL}/api/scans/${id}/report`);
  if (!res.ok) throw new Error('Failed to fetch scan report');
  return res.json();
}

export async function fetchComparison(currentId: string | number, previousId: string | number) {
  const res = await fetch(`${API_URL}/api/history/compare?current=${currentId}&previous=${previousId}`);
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return res.json();
}

export async function createScan(targetPath: string, branch?: string): Promise<{ scan_id: number }> {
  const res = await fetch(`${API_URL}/api/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      repository_url: targetPath,
      target_path: targetPath,
      path: targetPath,
      branch: branch || undefined
    })
  });
  if (!res.ok) throw new Error('Failed to create scan');
  return res.json();
}
