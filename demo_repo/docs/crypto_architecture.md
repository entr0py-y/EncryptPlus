# Cryptographic Architecture Documentation
# This file mentions algorithms but does NOT use them - false positive test

## Algorithm Overview

Our system uses RSA-2048 for authentication tokens and AES-256-GCM
for data encryption. We are evaluating ML-KEM-768 for future 
post-quantum key exchange.

The legacy system previously used DES and MD5 but these have been
removed from production code.

## Migration Notes
- RSA should be replaced with ML-DSA for signatures
- ECDH should be replaced with ML-KEM for key exchange
- SHA-1 has been deprecated organization-wide
