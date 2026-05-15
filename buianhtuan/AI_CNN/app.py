from flask import Flask, request, jsonify, render_template, Response, redirect, url_for, session, flash
from tensorflow.keras.models import load_model  # type: ignore
import numpy as np
import cv2
import base64
import threading
import time
import os
import re
import json
import pandas as pd
from PIL import ImageFont, ImageDraw, Image  # Thêm thư viện PIL từ test.py
from users import create_user, authenticate_user, get_user_by_username, get_user_by_email, reset_password, generate_random_password
from blockchain import Blockchain

# Khởi tạo ứng dụng Flask
app = Flask(__name__)

# Cấu hình bảo mật cho session
app.secret_key = os.urandom(24)

# Tải mô hình đã huấn luyện
model = load_model('fruitsuccess1_model.keras')  # Tải mô hình từ thư mục hiện tại

# Khởi tạo Blockchain
blockchain = Blockchain()

# Danh sách các lớp (tên trái cây và không phải trái cây) - theo thứ tự thư mục
classes = ['Chuối', 'Dâu tây', 'Dứa', 'Khế', 'Măng cụt', 'Không phải trái cây', 'Xoài']

# Thông tin dinh dưỡng cho từng loại quả
NUTRITION_DATA = {
    'Chuối': {
        'calo': '89 kcal',
        'carbs': '22.8g',
        'protein': '1.1g',
        'fat': '0.3g',
        'vitamin': 'C, B6, Kali',
        'benefit': 'Hỗ trợ tiêu hóa, tốt cho tim mạch và cung cấp năng lượng nhanh.'
    },
    'Dâu tây': {
        'calo': '32 kcal',
        'carbs': '7.7g',
        'protein': '0.7g',
        'fat': '0.3g',
        'vitamin': 'C, Mangan, Folate',
        'benefit': 'Tăng cường hệ miễn dịch, chống oxy hóa và làm đẹp da.'
    },
    'Dứa': {
        'calo': '50 kcal',
        'carbs': '13.1g',
        'protein': '0.5g',
        'fat': '0.1g',
        'vitamin': 'C, B6, Magie',
        'benefit': 'Hỗ trợ tiêu hóa nhờ bromelain, giảm viêm và tăng đề kháng.'
    },
    'Khế': {
        'calo': '31 kcal',
        'carbs': '6.7g',
        'protein': '1g',
        'fat': '0.3g',
        'vitamin': 'C, B5, Đồng',
        'benefit': 'Hỗ trợ giảm cân, tốt cho tim mạch và cải thiện tiêu hóa.'
    },
    'Măng cụt': {
        'calo': '73 kcal',
        'carbs': '17.9g',
        'protein': '0.4g',
        'fat': '0.6g',
        'vitamin': 'B1, B2, Magie',
        'benefit': 'Chống viêm mạnh mẽ, hỗ trợ giảm cân và tăng cường miễn dịch.'
    },
    'Xoài': {
        'calo': '60 kcal',
        'carbs': '15g',
        'protein': '0.8g',
        'fat': '0.4g',
        'vitamin': 'A, C, E, B6',
        'benefit': 'Tốt cho mắt, tăng cường hệ miễn dịch và hỗ trợ tiêu hóa.'
    },
    'Không phải trái cây': None
}

# Quản lý lịch sử nhận diện
HISTORY_FILE = 'history.json'

def save_history_entry(username, prediction, confidence, image_base64):
    """Lưu một mục lịch sử vào file json"""
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except:
            history = []
    
    # Tạo entry mới
    entry = {
        'username': username,
        'prediction': prediction,
        'confidence': f"{confidence:.2f}%",
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
        'image': image_base64
    }
    
    # Thêm vào đầu danh sách (mới nhất lên trên)
    history.insert(0, entry)
    
    # Giới hạn 50 mục gần nhất
    history = history[:50]
    
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(history, f, indent=4, ensure_ascii=False)

def record_to_blockchain(username, fruit_type, confidence, origin="Nông trại FruitAI - Việt Nam"):
    """Lưu kết quả nhận diện lên Blockchain để đảm bảo tính minh bạch"""
    transaction = {
        'inspector': username,
        'fruit_type': fruit_type,
        'confidence': confidence,
        'origin': origin,
        'lot_id': f"LOT-{int(time.time())}",
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S")
    }
    blockchain.add_new_transaction(transaction)
    # Tự động "đào" để tạo block mới sau mỗi giao dịch (đơn giản hóa cho demo)
    blockchain.mine()
    return transaction

lock = threading.Lock()
prediction_label = "Đang nhận diện..."
prediction_confidence = 0
last_prediction_time = 0
current_raw_frame = None

# Đường dẫn đến phông chữ Arial có sẵn trên Windows
font_path = "C:\\Windows\\Fonts\\arialbd.ttf"  # Sử dụng phông chữ Arial in đậm

@app.route('/')
def index():
    # Kiểm tra xem người dùng đã đăng nhập chưa
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Xác thực người dùng sử dụng module users
        success, result = authenticate_user(username, password)

        if success:
            # Lưu thông tin người dùng vào session
            session['username'] = username
            session['fullname'] = result['fullname']
            return redirect(url_for('index'))
        else:
            flash(result, 'error')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        fullname = request.form['fullname']
        email = request.form['email']
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Kiểm tra các trường dữ liệu
        if not fullname or not email or not username or not password or not confirm_password:
            flash('Vui lòng điền đầy đủ thông tin', 'error')
            return render_template('register.html')

        # Kiểm tra định dạng email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            flash('Email không hợp lệ', 'error')
            return render_template('register.html')

        # Kiểm tra mật khẩu
        if password != confirm_password:
            flash('Mật khẩu xác nhận không khớp', 'error')
            return render_template('register.html')

        if len(password) < 6:
            flash('Mật khẩu phải có ít nhất 6 ký tự', 'error')
            return render_template('register.html')

        # Tạo tài khoản mới
        success, message = create_user(username, password, fullname, email)

        if success:
            flash(message, 'success')
            return redirect(url_for('login'))
        else:
            flash(message, 'error')
            return render_template('register.html')

    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    session.pop('fullname', None)
    return redirect(url_for('login'))

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        username_or_email = request.form['username_or_email']

        # Tìm người dùng theo tên đăng nhập hoặc email
        user = get_user_by_username(username_or_email)
        if not user:
            user = get_user_by_email(username_or_email)

        if user:
            # Tạo mật khẩu mới ngẫu nhiên
            new_password = generate_random_password(10)

            # Đặt lại mật khẩu cho người dùng
            if reset_password(user['username'], new_password):
                # Trong thực tế, bạn sẽ gửi email với mật khẩu mới
                # Nhưng ở đây chúng ta sẽ hiển thị trực tiếp
                flash(f'Mật khẩu mới của bạn là: {new_password}', 'success')
                flash('Vui lòng đăng nhập với mật khẩu mới và đổi mật khẩu ngay sau khi đăng nhập.', 'success')
                return redirect(url_for('login'))
        else:
            flash('Không tìm thấy tài khoản với tên đăng nhập hoặc email này.', 'error')

    return render_template('forgot_password.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Nhận file ảnh từ yêu cầu POST
        file = request.files['file']
        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

        # Chuyển đổi sang RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Cắt ảnh thành hình vuông (Center Crop) để tránh bị méo khi resize
        h, w = img_rgb.shape[:2]
        size = min(h, w)
        start_h = (h - size) // 2
        start_w = (w - size) // 2
        cropped_img = img_rgb[start_h:start_h+size, start_w:start_w+size]

        # Resize ảnh về kích thước yêu cầu cho mô hình
        resized_frame = cv2.resize(cropped_img, (128, 128))

        # Chuẩn hóa ảnh
        test_image = resized_frame / 255.0
        test_image = np.expand_dims(test_image, axis=0)

        # Đưa dữ liệu vào mô hình
        result = model.predict(test_image)

        # Lấy xác suất của từng lớp
        class_probabilities = result[0].tolist()
        predicted_class_index = np.argmax(result)
        confidence_val = class_probabilities[predicted_class_index]

        # Ngưỡng tin cậy (Threshold) - Nếu thấp hơn 60% thì coi là không nhận diện được
        if confidence_val < 0.60:
            prediction = 'Không nhận diện được'
        else:
            prediction = classes[predicted_class_index]

        # Lấy xác suất của từng lớp
        class_probabilities = result[0].tolist()  # Chuyển kết quả mảng xác suất thành danh sách

        # Chỉ giới hạn xác suất 100% cho lớp "Không phải trái cây" trong hiển thị
        if prediction == 'Không phải trái cây' and class_probabilities[predicted_class_index] >= 0.999:
            class_probabilities[predicted_class_index] = 0.999

        # Mã hóa lại ảnh gốc sang định dạng base64 để trả về cho client
        _, img_encoded = cv2.imencode('.png', img)
        img_base64 = base64.b64encode(img_encoded).decode('utf-8')

        # Lưu vào lịch sử nếu đã đăng nhập
        if 'username' in session:
            confidence_val = class_probabilities[predicted_class_index] * 100
            save_history_entry(session['username'], prediction, confidence_val, img_base64)
            
            # Ghi lên Blockchain nếu là trái cây
            if prediction != 'Không phải trái cây':
                record_to_blockchain(session['username'], prediction, f"{confidence_val:.2f}%")

        # Trả về kết quả dưới dạng JSON
        return jsonify({
            'prediction': prediction,  # Dự đoán lớp cao nhất
            'probabilities': class_probabilities,  # Xác suất của từng lớp
            'image': img_base64,  # Hình ảnh được mã hóa base64
            'nutrition': NUTRITION_DATA.get(prediction)  # Thêm thông tin dinh dưỡng
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/capture', methods=['POST'])
def capture():
    global output_frame, lock
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    with lock:
        if output_frame is None:
            return jsonify({'error': 'No frame available'}), 400
        frame = output_frame.copy()
    
    # Convert BGR to RGB
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    # Square crop
    h, w = frame_rgb.shape[:2]
    size = min(h, w)
    start_h = (h - size) // 2
    start_w = (w - size) // 2
    cropped_frame = frame_rgb[start_h:start_h+size, start_w:start_w+size]
    
    resized_frame = cv2.resize(cropped_frame, (128, 128))
    test_image = resized_frame / 255.0
    test_image = np.expand_dims(test_image, axis=0)
    
    result = model.predict(test_image, verbose=0)
    predicted_class_index = np.argmax(result)
    max_conf = float(np.max(result))
    
    if max_conf < 0.60:
        prediction = 'Không nhận diện được'
    else:
        prediction = classes[predicted_class_index]
    
    confidence = max_conf * 100
    confidence = float(np.max(result) * 100)
    
    # Encode frame for history
    _, img_encoded = cv2.imencode('.png', frame)
    img_base64 = base64.b64encode(img_encoded).decode('utf-8')
    
    # Save to history
    save_history_entry(session['username'], prediction, confidence, img_base64)
    
    return jsonify({
        'prediction': prediction,
        'confidence': f"{confidence:.2f}%",
        'nutrition': NUTRITION_DATA.get(prediction)
    })

def inference_worker():
    global camera_active, current_raw_frame, prediction_label, prediction_confidence
    
    while camera_active:
        if current_raw_frame is not None:
            with lock:
                frame_to_process = current_raw_frame.copy()
            
            try:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame_to_process, cv2.COLOR_BGR2RGB)
                
                # Square crop
                h, w = frame_rgb.shape[:2]
                size = min(h, w)
                start_h = (h - size) // 2
                start_w = (w - size) // 2
                cropped_frame = frame_rgb[start_h:start_h+size, start_w:start_w+size]
                
                resized_frame = cv2.resize(cropped_frame, (128, 128))
                test_image = resized_frame / 255.0
                test_image = np.expand_dims(test_image, axis=0)
                
                # Predict
                result = model.predict(test_image, verbose=0)
                predicted_class_index = np.argmax(result)
                max_conf = float(np.max(result))
                
                # Update global prediction
                if max_conf < 0.60:
                    prediction_label = 'Đang nhận diện...'
                    prediction_confidence = max_conf * 100
                else:
                    prediction_label = classes[predicted_class_index]
                    prediction_confidence = max_conf * 100
            except Exception as e:
                print(f"Inference error: {e}")
        
        # Chạy nhận diện khoảng 2-3 lần mỗi giây là đủ, tránh overload
        time.sleep(0.3)

# Hàm xử lý camera và nhận dạng trái cây
def camera_stream():
    global camera, camera_active, output_frame, current_raw_frame, prediction_label

    # Khởi tạo camera
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Không thể mở camera")
        camera_active = False
        return

    camera_active = True
    
    # Khởi tạo thread nhận diện tách biệt để không gây lag
    inf_thread = threading.Thread(target=inference_worker)
    inf_thread.daemon = True
    inf_thread.start()

    while camera_active:
        success, frame = camera.read()
        if not success:
            break

        # Cập nhật khung hình gốc cho thread nhận diện
        with lock:
            current_raw_frame = frame.copy()

        # Vẽ overlay lên khung hình hiển thị
        try:
            # Convert frame (numpy array) thành ảnh PIL để sử dụng ImageFont (Tiếng Việt)
            pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(pil_img)
            font = ImageFont.truetype(font_path, 32)

            text = f"Dự đoán: {prediction_label.upper()}"
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            # Vẽ nền cho chữ
            draw.rectangle((10, 50, 20 + text_width, 60 + text_height), fill=(255, 255, 255))
            draw.text((15, 50), text, font=font, fill=text_color)

            # Chuyển lại về OpenCV
            frame = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Lỗi vẽ text: {e}")

        # Lưu khung hình để streaming
        with lock:
            output_frame = frame.copy()

        # Giảm thời gian chờ để mượt hơn
        time.sleep(0.01)

    # Giải phóng camera khi kết thúc
    camera.release()

# Hàm tạo các khung hình cho streaming
def generate_frames():
    global output_frame, lock

    while True:
        with lock:
            if output_frame is None:
                continue

            # Mã hóa khung hình thành JPEG
            (flag, encoded_image) = cv2.imencode(".jpg", output_frame)
            if not flag:
                continue

        # Trả về khung hình dưới dạng byte stream
        yield(b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' +
              bytearray(encoded_image) + b'\r\n')

        # Tránh sử dụng quá nhiều CPU, giảm thời gian sleep để giảm lag
        time.sleep(0.01)

# Route cho camera stream
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Route để bật/tắt camera
@app.route('/toggle_camera', methods=['POST'])
def toggle_camera():
    global camera_active, camera

    action = request.json.get('action')

    if action == 'start' and not camera_active:
        # Bắt đầu luồng camera trong một thread riêng
        camera_thread = threading.Thread(target=camera_stream)
        camera_thread.daemon = True
        camera_thread.start()
        return jsonify({'status': 'Camera started'})

    elif action == 'stop' and camera_active:
        # Dừng camera
        camera_active = False
        if camera is not None:
            camera.release()
        return jsonify({'status': 'Camera stopped'})

    return jsonify({'status': 'No action taken'})

@app.route('/get_history')
def get_history():
    if 'username' not in session:
        return jsonify([])
    
    if not os.path.exists(HISTORY_FILE):
        return jsonify([])
    
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
            # Lọc theo username
            user_history = [h for h in history if h['username'] == session['username']]
            return jsonify(user_history)
    except:
        return jsonify([])

@app.route('/delete_history/<int:entry_index>', methods=['POST'])
def delete_history(entry_index):
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    if not os.path.exists(HISTORY_FILE):
        return jsonify({'success': False, 'message': 'No history file found'}), 404
        
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
            
        # Tìm các mục của user này
        user_entries = []
        for i, entry in enumerate(history):
            if entry['username'] == session['username']:
                user_entries.append(i)
        
        if entry_index < 0 or entry_index >= len(user_entries):
            return jsonify({'success': False, 'message': 'Invalid index'}), 400
            
        # Xóa mục tại index thực tế trong file
        actual_index = user_entries[entry_index]
        history.pop(actual_index)
        
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=4, ensure_ascii=False)
            
        return jsonify({'success': True, 'message': 'Deleted successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/clear_history', methods=['POST'])
def clear_history():
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    if not os.path.exists(HISTORY_FILE):
        return jsonify({'success': True, 'message': 'History already empty'})
        
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
            
        # Lọc ra những mục KHÔNG phải của user này
        new_history = [h for h in history if h['username'] != session['username']]
        
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(new_history, f, indent=4, ensure_ascii=False)
            
        return jsonify({'success': True, 'message': 'History cleared successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/export_history/<format>')
def export_history(format):
    if 'username' not in session:
        return "Unauthorized", 401
    
    if not os.path.exists(HISTORY_FILE):
        return "No history found", 404
    
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
            user_history = [h for h in history if h['username'] == session['username']]
            
        if not user_history:
            return "No data to export", 404
            
        # Loại bỏ trường image khi export ra file văn bản
        export_data = []
        for item in user_history:
            export_data.append({
                'Thời gian': item['timestamp'],
                'Kết quả': item['prediction'],
                'Độ tin cậy': item['confidence']
            })
            
        df = pd.DataFrame(export_data)
        
        if format == 'excel':
            output_file = f"history_{session['username']}_{int(time.time())}.xlsx"
            df.to_excel(output_file, index=False)
            
            # Gửi file về client
            from flask import send_file
            return send_file(output_file, as_attachment=True)
            
        elif format == 'csv':
            output_file = f"history_{session['username']}_{int(time.time())}.csv"
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            
            from flask import send_file
            return send_file(output_file, as_attachment=True)
            
        return "Unsupported format", 400
    except Exception as e:
        return str(e), 500

@app.route('/get_blockchain')
def get_blockchain():
    """Lấy toàn bộ chuỗi blockchain để hiển thị truy xuất nguồn gốc"""
    chain_data = []
    for block in blockchain.chain:
        chain_data.append(block.__dict__)
    return jsonify({
        'length': len(chain_data),
        'chain': chain_data,
        'is_valid': blockchain.check_chain_validity()
    })

@app.route('/get_stats')
def get_stats():
    """Lấy dữ liệu thống kê cho Dashboard"""
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if not os.path.exists(HISTORY_FILE):
        return jsonify({'counts': {}, 'total': 0})
        
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            history = json.load(f)
            user_history = [h for h in history if h['username'] == session['username']]
            
        # Đếm số lượng từng loại quả
        counts = {}
        for item in user_history:
            fruit = item['prediction']
            counts[fruit] = counts.get(fruit, 0) + 1
            
        return jsonify({
            'counts': counts,
            'total': len(user_history)
        })
    except:
        return jsonify({'counts': {}, 'total': 0})

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
