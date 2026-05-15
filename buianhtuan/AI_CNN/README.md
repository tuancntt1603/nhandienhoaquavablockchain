# Ứng Dụng Nhận Diện Trái Cây Bằng CNN

Ứng dụng web sử dụng Deep Learning (CNN với MobileNetV2) để nhận diện các loại trái cây qua camera hoặc upload ảnh.

## 🍎 Các Loại Trái Cây Nhận Diện Được

- Chuối
- Dâu tây
- Dứa
- Khế
- Măng cụt
- Xoài
- Không phải trái cây

## 📋 Yêu Cầu Hệ Thống

- **Python**: 3.8 trở lên (khuyến nghị 3.11)
- **Hệ điều hành**: Windows/Linux/MacOS
- **RAM**: Tối thiểu 4GB
- **Camera**: Nếu sử dụng chức năng nhận diện real-time

## 📦 Các Thư Viện Cần Cài Đặt

### 1. Flask (Web Framework)
```bash
pip install flask
```
Dùng để tạo web server, xử lý HTTP requests

### 2. TensorFlow & Keras (Deep Learning)
```bash
pip install tensorflow
```
Thư viện chính để chạy mô hình CNN, bao gồm cả Keras

### 3. NumPy (Xử lý mảng số)
```bash
pip install numpy
```
Xử lý dữ liệu số, ma trận cho ảnh và model

### 4. OpenCV (Xử lý ảnh & Camera)
```bash
pip install opencv-python
```
Đọc/ghi ảnh, xử lý camera real-time, resize ảnh

### 5. Pillow (PIL - Xử lý ảnh)
```bash
pip install pillow
```
Vẽ chữ tiếng Việt lên ảnh (OpenCV không hỗ trợ Unicode tốt)

### 6. Keras Preprocessing
```bash
pip install keras-preprocessing
```
Xử lý và tăng cường dữ liệu ảnh khi training

## 🚀 Cài Đặt Tất Cả Thư Viện

### Cách 1: Cài từng thư viện
```bash
pip install flask tensorflow numpy opencv-python pillow keras-preprocessing
```

### Cách 2: Tạo file requirements.txt
Tạo file `requirements.txt` với nội dung:
```
flask
tensorflow
numpy
opencv-python
pillow
keras-preprocessing
```

Sau đó cài đặt:
```bash
pip install -r requirements.txt
```

## 📂 Cấu Trúc Thư Mục

```
AI_CNN/
│
├── app.py                          # Ứng dụng Flask chính
├── users.py                        # Quản lý tài khoản người dùng
├── users.json                      # Database người dùng
├── fruitsuccess1_model.keras       # Mô hình đã train
│
├── nn/                             # Thư mục training
│   ├── cnn_fruit.py               # Code train model
│   ├── train1/                    # Dữ liệu training
│   │   ├── chuối/
│   │   ├── dâu tây/
│   │   ├── dứa/
│   │   ├── khe/
│   │   ├── mangcut/
│   │   ├── none/
│   │   └── xoai/
│   └── test1/                     # Dữ liệu validation
│       └── ...
│
├── templates/                      # HTML templates
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── forgot_password.html
│
└── static/                         # CSS, JS, ảnh
    ├── styles.css
    ├── login.css
    ├── script.js
    └── images/
```

## 🎯 Hướng Dẫn Sử Dụng

### Bước 1: Train Model (nếu chưa có)
```bash
python nn/cnn_fruit.py
```
Quá trình train sẽ mất 10-15 phút, sau đó tạo file `fruitsuccess1_model.keras`

### Bước 2: Chạy Ứng Dụng Web
```bash
python app.py
```

### Bước 3: Mở Trình Duyệt
Truy cập: `http://127.0.0.1:5000`

### Bước 4: Đăng Ký/Đăng Nhập
- Tạo tài khoản mới hoặc đăng nhập
- Sử dụng 2 chức năng:
  - **Upload Ảnh**: Tải ảnh trái cây lên
  - **Camera Real-time**: Nhận diện trực tiếp qua webcam

## 💡 Mẹo Sử Dụng

### Upload Ảnh:
- Chụp ảnh trái cây rõ ràng, ánh sáng tốt
- Trái cây nên chiếm khoảng 50-80% ảnh
- Tránh background quá phức tạp

### Camera Real-time:
- Di chuyển camera gần/xa để tìm góc tốt nhất
- Giữ trái cây ở giữa khung hình
- Đảm bảo ánh sáng đủ sáng

## ⚠️ Xử Lý Lỗi Thường Gặp

### Lỗi: "No module named 'tensorflow'"
```bash
pip install tensorflow
```

### Lỗi: "Camera không mở được"
- Kiểm tra camera đã kết nối chưa
- Đóng các ứng dụng khác đang dùng camera
- Thử đổi `cv2.VideoCapture(0)` thành `cv2.VideoCapture(1)`

### Lỗi: "ValueError: Layer 'dense' expects 1 input"
- Xóa file model cũ và train lại:
```bash
Remove-Item fruitsuccess1_model.keras
python nn/cnn_fruit.py
```

### Lỗi: "Address already in use"
- Tắt Flask đang chạy (Ctrl+C)
- Hoặc đổi port trong `app.py`:
```python
app.run(debug=True, port=5001)
```

## 📊 Thông Số Model

- **Kiến trúc**: MobileNetV2 + Dense Layers
- **Input size**: 128x128x3
- **Số lớp phân loại**: 7
- **Accuracy**: ~85-95% (tùy dữ liệu training)
- **Training time**: 10-15 phút (20 epochs)

## 📝 Ghi Chú

- Model sử dụng **Transfer Learning** với MobileNetV2 pre-trained trên ImageNet
- Data augmentation: xoay, dịch, zoom, lật, thay đổi độ sáng
- Dropout và BatchNormalization để tránh overfitting

## 👨‍💻 Tác Giả

Dự án AI_CNN - Nhận diện trái cây

## 📄 License

Free to use for educational purposes
