# ENCRYPT PLUS
### Enterprise Cryptographic Discovery & Analysis Tool (ECDAT)

**Smart India Hackathon 2026 — Problem Statement SIH26164**  
**Organization:** National Technical Research Organisation (NTRO)  
**Theme:** Blockchain & Cybersecurity  

---

## Overview

**ENCRYPT PLUS** is a post-quantum cryptographic intelligence, posture analysis, and remediation governance platform. It identifies, catalogues, and evaluates cryptographic algorithms, keys, certificates, protocols, and dependencies across enterprise source code repositories to generate a comprehensive Cryptographic Bill of Materials (CBOM).

---

## Core Capabilities

1. **Deterministic Cryptographic Discovery**:
   - Deep Abstract Syntax Tree (AST) & pattern-matching inspection across multi-language codebases (Java, Go, Python, C/C++, JavaScript/TypeScript, Rust).
   - Automated Cryptographic Bill of Materials (CBOM) generation compliant with CycloneDX specifications.

2. **Quantum Exposure Modeling & PQC Assessment**:
   - Classifies cryptographic assets against **Shor's Algorithm** (asymmetric key exchange, digital signatures) and **Grover's Algorithm** (symmetric keys, hash functions).
   - QRAMM-compliant Post-Quantum Cryptography (PQC) readiness scoring.
   - Interactive **Mosca's Inequality Simulator** ($X + Y > Z$) modeling Harvest Now, Decrypt Later (HNDL) attack windows.

3. **Deterministic Categorical Risk Scoring**:
   - Evaluates security posture across 10 independent dimensions:
     `Algorithm`, `Key`, `Config`, `Misuse`, `Vulnerability`, `Dependency`, `Protocol`, `Certificate`, `Compliance`, and `PQC Readiness`.

4. **Compliance Governance**:
   - Automated mapping against **NIST SP 800-131A Rev 2**, **FIPS 140-3**, and **NSA CNSA 2.0** standards.

5. **Actionable PQC Migration Roadmap**:
   - Prioritized (P0–P3) algorithm transition flows (e.g. RSA-2048 / ECDSA $\rightarrow$ NIST FIPS 203 ML-KEM-768 / FIPS 204 ML-DSA-65).

6. **18-Section Assessment Report Generator**:
   - Full technical audit documentation with executive summaries, code-level evidence, and historical drift analysis.

---

## Architecture & Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Strict Monochrome Design System.
- **Backend API**: FastAPI (Python 3.11), SQLAlchemy, SQLite / PostgreSQL.
- **Scanner Core**: Go `cryptoscan` v1.4.0 binary engine.

---

## Quickstart & Local Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Go 1.21+ (for building CryptoScan core)
- Git

### 2. Build CryptoScan Core
```bash
cd cryptoscan
go build -o cryptoscan cmd/cryptoscan/main.go
cd ..
```

### 3. Start Backend API
```bash
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic jinja2
PYTHONPATH=. uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Start Next.js Frontend
```bash
cd apps/web
npm install
npm run dev -- -p 3001
```

Access the UI at: **`http://localhost:3001`**  
Access the API docs at: **`http://localhost:8000/docs`**

---

## License
Apache-2.0 License.
