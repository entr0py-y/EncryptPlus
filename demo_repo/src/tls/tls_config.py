"""
TLS Configuration Module
Various TLS/SSL configurations for testing
"""
import ssl
import socket

# INSECURE: TLS 1.0 configuration
def create_legacy_tls_context():
    """DEPRECATED: Creates TLS 1.0 context. Migrate to TLS 1.3."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLSv1)
    context.set_ciphers('AES128-SHA:DES-CBC3-SHA:RC4-SHA')
    return context

# INSECURE: Certificate validation bypass
def create_insecure_context():
    """CRITICAL: Bypasses certificate validation."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE  # InsecureSkipVerify equivalent
    return context

# SECURE: TLS 1.3 configuration  
def create_secure_tls_context():
    """Secure TLS 1.3 configuration."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.minimum_version = ssl.TLSVersion.TLSv1_3
    context.set_ciphers('TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256')
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context

# mTLS configuration
def create_mtls_context(cert_file: str, key_file: str, ca_file: str):
    """Create mutual TLS context for client authentication."""
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
    context.load_verify_locations(cafile=ca_file)
    context.verify_mode = ssl.CERT_REQUIRED
    context.check_hostname = True
    return context
