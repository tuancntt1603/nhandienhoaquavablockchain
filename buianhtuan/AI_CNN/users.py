import json
import os
import hashlib
import random
import string
from werkzeug.security import generate_password_hash, check_password_hash

# Đường dẫn đến file lưu trữ người dùng
USERS_FILE = 'users.json'

def init_users_file():
    """Khởi tạo file users.json nếu chưa tồn tại"""
    if not os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump({"users": []}, f)
        # Tạo tài khoản admin mặc định
        create_user('admin', 'admin', 'Admin', 'admin@example.com')

def load_users():
    """Tải danh sách người dùng từ file"""
    if not os.path.exists(USERS_FILE):
        init_users_file()

    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_users(users_data):
    """Lưu danh sách người dùng vào file"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users_data, f, indent=4)

def create_user(username, password, fullname, email):
    """Tạo người dùng mới"""
    users_data = load_users()

    # Kiểm tra xem username đã tồn tại chưa
    for user in users_data['users']:
        if user['username'] == username:
            return False, "Tên đăng nhập đã tồn tại"

    # Mã hóa mật khẩu
    hashed_password = generate_password_hash(password)

    # Tạo người dùng mới
    new_user = {
        'username': username,
        'password': hashed_password,
        'fullname': fullname,
        'email': email
    }

    # Thêm vào danh sách
    users_data['users'].append(new_user)
    save_users(users_data)

    return True, "Tạo tài khoản thành công"

def authenticate_user(username, password):
    """Xác thực người dùng"""
    users_data = load_users()

    for user in users_data['users']:
        if user['username'] == username:
            if check_password_hash(user['password'], password):
                return True, user
            else:
                return False, "Mật khẩu không đúng"

    return False, "Tên đăng nhập không tồn tại"

def get_user_by_username(username):
    """Lấy thông tin người dùng theo username"""
    users_data = load_users()

    for user in users_data['users']:
        if user['username'] == username:
            return user

    return None

def get_user_by_email(email):
    """Lấy thông tin người dùng theo email"""
    users_data = load_users()

    for user in users_data['users']:
        if user.get('email') == email:
            return user

    return None

def reset_password(username, new_password):
    """Đặt lại mật khẩu cho người dùng"""
    users_data = load_users()

    for user in users_data['users']:
        if user['username'] == username:
            # Mã hóa mật khẩu mới
            user['password'] = generate_password_hash(new_password)
            save_users(users_data)
            return True

    return False

def generate_random_password(length=8):
    """Tạo mật khẩu ngẫu nhiên"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choice(characters) for _ in range(length))

# Khởi tạo file người dùng khi import module
init_users_file()
