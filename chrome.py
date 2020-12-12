import os
import sys
import shutil
import sqlite3
import win32crypt
import json, base64

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import (
    Cipher, algorithms, modes)

# DB_PATH = r'Google\Chrome\User Data\Default\Login Data'

def decrypt(cipher, ciphertext, nonce):
    cipher.mode = modes.GCM(nonce)
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext)

def get_cipher(key):
    cipher = Cipher(
        algorithms.AES(key),
        None,
        backend=default_backend()
    )
    return cipher

def dpapi_decrypt(encrypted):
    import ctypes
    import ctypes.wintypes

    class DATA_BLOB(ctypes.Structure):
        _fields_ = [('cbData', ctypes.wintypes.DWORD),
                    ('pbData', ctypes.POINTER(ctypes.c_char))]

    p = ctypes.create_string_buffer(encrypted, len(encrypted))
    blobin = DATA_BLOB(ctypes.sizeof(p), p)
    blobout = DATA_BLOB()
    retval = ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(blobin), None, None, None, None, 0, ctypes.byref(blobout))
    if not retval:
        raise ctypes.WinError()
    result = ctypes.string_at(blobout.pbData, blobout.cbData)
    ctypes.windll.kernel32.LocalFree(blobout.pbData)
    return result

def unix_decrypt(encrypted):
    if sys.platform.startswith('linux'):
        password = 'peanuts'
        iterations = 1
    else:
        raise NotImplementedError

    from Crypto.Cipher import AES
    from Crypto.Protocol.KDF import PBKDF2

    salt = 'saltysalt'
    iv = ' ' * 16
    length = 16
    key = PBKDF2(password, salt, length, iterations)
    cipher = AES.new(key, AES.MODE_CBC, IV=iv)
    decrypted = cipher.decrypt(encrypted[3:])
    return decrypted[:-ord(decrypted[-1])]

def get_key_from_local_state():
    cookie_path = APP_DATA_PATH + r"\Google\Chrome\User Data\Local State"
    with open(cookie_path, encoding='utf-8',mode ="r") as f:
        enc_key = json.loads(str(f.readline()))
    return enc_key["os_crypt"]["encrypted_key"]

def aes_decrypt(encrypted_txt):
    encoded_key = get_key_from_local_state()
    encrypted_key = base64.b64decode(encoded_key.encode())
    encrypted_key = encrypted_key[5:]
    key = dpapi_decrypt(encrypted_key)
    nonce = encrypted_txt[3:15]
    cipher = get_cipher(key)
    return decrypt(cipher,encrypted_txt[15:],nonce)

def show_password(db_file):
    conn = sqlite3.connect(db_file)
    _sql = 'SELECT origin_url, username_value, password_value FROM logins'
    for row in conn.execute(_sql):
        url = row[0]
        if url.startswith('android'):
            continue
        username = row[1]
        password = chrome_decrypt(row[2])
        _info = f"Url: {url} Username: {username}, Password {password}"
        print(_info)
    conn.close()
    os.remove(db_file)

def get_chrome_db(home_path, db_path):
    _login_db = os.path.join(home_path, db_path)

    if not os.path.isfile(_login_db):
        exit(0)

    _temp_path = os.path.join(home_path,'sqlite_file')

    if os.path.exists(_temp_path):
        os.remove(_temp_path)

    shutil.copyfile(_login_db,_temp_path)
    show_password(_temp_path)

def chrome_decrypt(encrypted_txt):
    if sys.platform == 'win32':
        try:
            if encrypted_txt[:4] == b'\x01\x00\x00\x00':
                decrypted_txt = dpapi_decrypt(encrypted_txt)
                return decrypted_txt.decode()
            elif encrypted_txt[:3] == b'v10' or encrypted_txt[:3] == b'v11':
                decrypted_txt = aes_decrypt(encrypted_txt)
                return decrypted_txt[:-16].decode()
        except WindowsError:
            return None
    else:
        try:
            return unix_decrypt(encrypted_txt)
        except NotImplementedError:
            return None

if __name__=="__main__":
    if sys.platform == "win32":
        home_path = os.environ['LOCALAPPDATA']
        db_path = r'Google\Chrome\User Data\Default\Login Data'
    elif sys.platform.startswith("linux"):
        home_path = os.environ['HOME']
        db_path = r'Google\Chrome\User Data\Default\Login Data'

    get_chrome_db(home_path, db_path)