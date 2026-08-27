# Demo Go file with crypto usage patterns
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/x509"
	"fmt"
	"io"
)

// RSA-2048 key generation (quantum-vulnerable)
func generateRSAKey() (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, 2048)
}

// RSA-1024 key generation (weak + quantum-vulnerable)
func generateWeakRSAKey() (*rsa.PrivateKey, error) {
	return rsa.GenerateKey(rand.Reader, 1024)
}

// ECDSA P-256 key generation (quantum-vulnerable)
func generateECDSAKey() (*ecdsa.PrivateKey, error) {
	return ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
}

// AES-256-GCM encryption (quantum-resistant)
func encryptAESGCM(key, plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

// MD5 hashing (broken, do not use)
func hashMD5(data []byte) [16]byte {
	return md5.Sum(data)
}

// SHA-1 hashing (deprecated)
func hashSHA1(data []byte) [20]byte {
	return sha1.Sum(data)
}

// SHA-256 hashing (quantum-partial but acceptable)
func hashSHA256(data []byte) [32]byte {
	return sha256.Sum256(data)
}

// X.509 certificate parsing
func parseCertificate(certData []byte) (*x509.Certificate, error) {
	return x509.ParseCertificate(certData)
}

func main() {
	fmt.Println("Crypto demo application")
}
