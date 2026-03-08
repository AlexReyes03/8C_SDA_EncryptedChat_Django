import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';

export const CHAT_CRYPTO = {

    // Bloque RSA
    generateRSAKeys: () => {
        const crypt = new JSEncrypt({ default_key_size: '2048' });
        crypt.getKey();
        return {
            privateKey: crypt.getPrivateKey(),
            publicKey: crypt.getPublicKey()
        };
    },
    
    encryptRSA: (publicKey: string, text: string): string | false => {
        const encrypt = new JSEncrypt();
        encrypt.setPublicKey(publicKey);
        return encrypt.encrypt(text);
    },

    decryptRSA: (privateKey: string, encryptedText: string): string | false => {
        const decrypt = new JSEncrypt();
        decrypt.setPrivateKey(privateKey);
        return decrypt.decrypt(encryptedText);
    },

    // Bloque AES
    generateGroupAESKey: (): string => {
        return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    },

    encryptAES: (aesKey: string, text: string): string => {
        return CryptoJS.AES.encrypt(text, aesKey).toString();
    },

    decryptAES: (aesKey: string, encryptedText: string): string => {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, aesKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return "";
        }
    },

    // Bloque LocalStorage
    encryptPrivateKey: (privateKey: string, password: string): string => {
        return CryptoJS.AES.encrypt(privateKey, password).toString();
    },

    decryptPrivateKey: (encryptedPrivateKey: string, password: string): string => {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return "";
        }
    },

    saveMyPrivateKey: (username: string, privateKey: string) => {
        localStorage.setItem(`enc_chat_pk_${username}`, privateKey);
    },

    getMyPrivateKey: (username: string): string | null => {
        return localStorage.getItem(`enc_chat_pk_${username}`);
    },

    getPublicKeyFromPrivate: (username: string): string | null => {
        const privKey = localStorage.getItem(`enc_chat_pk_${username}`);
        if (!privKey) return null;
        const crypt = new JSEncrypt();
        crypt.setPrivateKey(privKey);
        return crypt.getPublicKey();
    }
};
