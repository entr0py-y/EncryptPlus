import subprocess
import json
import os
import shutil
import uuid

CRYPTOSCAN_BIN = os.getenv('CRYPTOSCAN_BIN', '/Users/erenyeager/Desktop/EncryptPlus/cryptoscan/cryptoscan')

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
    cmd = ['git', 'clone', '--depth', '1']
    if branch:
        cmd.extend(['--branch', branch])
    cmd.extend([repo_url, target_dir])
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"Failed to clone repository: {e.stderr.decode()}")
