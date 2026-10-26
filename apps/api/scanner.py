import subprocess
import json
import os
import shutil
import uuid

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_CRYPTOSCAN = os.path.join(_BASE_DIR, "cryptoscan", "cryptoscan")
CRYPTOSCAN_BIN = os.getenv('CRYPTOSCAN_BIN', _DEFAULT_CRYPTOSCAN)

def execute_cryptoscan(target_path: str, output_file: str) -> dict:
    if not os.path.exists(CRYPTOSCAN_BIN):
        raise RuntimeError(f"CryptoScan binary not found at {CRYPTOSCAN_BIN}")
        
    cmd = [
        CRYPTOSCAN_BIN, 'scan', target_path,
        '--format', 'json',
        '--output', output_file,
        '--verbose',
        '--pretty'
    ]
    
    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    except subprocess.TimeoutExpired:
        raise RuntimeError("CryptoScan timeout")
        
    if not os.path.exists(output_file):
        raise RuntimeError("CryptoScan failed to produce output file")
        
    with open(output_file, 'r') as f:
        return json.load(f)

def clone_repository(repo_url: str, target_dir: str, branch: str = None):
    cmd = ['git', 'clone', '--depth', '1', '--single-branch', '--no-tags']
    if branch:
        cmd.extend(['--branch', branch])
    cmd.extend([repo_url, target_dir])
    
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=600, env=env)
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Repository clone timed out after 600 seconds. The repository may be too large or the network connection is slow.")
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr.decode('utf-8', errors='replace').strip() if e.stderr else str(e)
        raise RuntimeError(f"Failed to clone repository: {error_msg}")
