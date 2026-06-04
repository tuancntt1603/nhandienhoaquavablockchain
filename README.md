<h2 align="center">
<a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
🎓 Faculty of Information Technology (DaiNam University)
</a>
</h2>

<h1 align="center">
 PHÂN LOẠI HOA QUẢ VÀ QUẢN LÝ BẰNG BLOCKCHAIN
</h1>

<div align="center">

<!-- Thay logo.png bằng ảnh của bạn trong repo -->
<img width="180" src="https://github.com/user-attachments/assets/77fe0fd1-2e55-4032-be3c-b1a705a1b574"/>

<br><br>

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![TensorFlow](https://img.shields.io/badge/TensorFlow-AI-orange?style=for-the-badge&logo=tensorflow)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-green?style=for-the-badge)
![University](https://img.shields.io/badge/DaiNam-University-orange?style=for-the-badge)

</div>

---


# 📖 1. Giới thiệu đề tài

**Nhận Diện Hoa Quả Và Ứng Dụng Blockchain** là dự án kết hợp giữa **Trí tuệ nhân tạo (AI)** và **Blockchain** nhằm xây dựng hệ thống nhận diện các loại hoa quả từ hình ảnh và lưu trữ thông tin xác thực trên blockchain.

Hệ thống cho phép người dùng tải ảnh hoa quả lên giao diện web, sau đó mô hình AI sẽ phân tích và đưa ra kết quả dự đoán. Các thông tin nhận diện có thể được ghi nhận lên blockchain để đảm bảo tính minh bạch và khả năng truy xuất nguồn gốc.

### 🎯 Mục tiêu của đề tài

* Xây dựng mô hình AI nhận diện hoa quả từ hình ảnh
* Ứng dụng Deep Learning trong xử lý ảnh
* Kết hợp Blockchain để lưu trữ dữ liệu minh bạch
* Xây dựng hệ thống web hoàn chỉnh
* Nâng cao khả năng nghiên cứu và phát triển công nghệ mới

---

# 🔍 2. Chức năng hệ thống

* ✅ Nhận diện hoa quả từ ảnh tải lên
* ✅ Phân loại nhiều loại trái cây khác nhau
* ✅ Hiển thị kết quả dự đoán trực quan
* ✅ Lưu lịch sử nhận diện
* ✅ Kết nối Blockchain để xác thực dữ liệu
* ✅ Quản lý thông tin hoa quả

---

# ✨ 3. Tính năng nổi bật

## 🟢 Hệ thống AI

* Nhận diện hình ảnh bằng CNN
* Dự đoán nhanh chóng
* Độ chính xác cao
* Hỗ trợ mở rộng tập dữ liệu

## 🔴 Blockchain

* Lưu trữ thông tin nhận diện
* Tăng tính minh bạch
* Truy xuất nguồn gốc dữ liệu
* Đảm bảo tính toàn vẹn thông tin

## 🟡 Giao diện Web

* Thiết kế đơn giản, dễ sử dụng
* Tải ảnh trực tiếp từ máy tính
* Hiển thị kết quả trực quan
* Theo dõi lịch sử nhận diện

## 🔵 Quản lý dữ liệu

* Lưu trữ thông tin hoa quả
* Quản lý kết quả dự đoán
* Hỗ trợ truy vấn dữ liệu
* Dễ dàng mở rộng hệ thống

---

# ⚙️ 4. Công nghệ sử dụng

| Thành phần | Công nghệ sử dụng |
|------------|------------------|
| AI / Deep Learning | TensorFlow, CNN |
| Xử lý ảnh | OpenCV |
| Backend | Python, Flask |
| Frontend | HTML, CSS, JavaScript |
| Blockchain | Ethereum, Smart Contract |
| Ví Blockchain | MetaMask |
| Cơ sở dữ liệu | SQLite |
| Quản lý mã nguồn | GitHub |

---

# 📂 5. Cấu trúc dự án

```bash
nhandienhoaquavablockchain/
│
├── dataset/
│   ├── apple/
│   ├── banana/
│   ├── orange/
│
├── model/
│   ├── fruit_model.h5
│
├── blockchain/
│   ├── smart_contract.sol
│
├── static/
│   ├── css/
│   ├── js/
│   ├── images/
│
├── templates/
│   ├── index.html
│
├── app.py
├── train.py
├── predict.py
├── requirements.txt
├── README.md
```

---

# ▶️ 6. Cách cài đặt và chạy dự án

## 1️⃣ Clone dự án

```bash
git clone https://github.com/tuancntt1603/nhandienhoaquavablockchain.git
```

```bash
cd nhandienhoaquavablockchain
```

---

## 2️⃣ Cài đặt thư viện

```bash
pip install -r requirements.txt
```

Hoặc:

```bash
pip install tensorflow opencv-python flask numpy
```

---

## 3️⃣ Chạy hệ thống

```bash
python app.py
```

---

## 4️⃣ Truy cập giao diện

```text
http://127.0.0.1:5000
```

---

## 📌 Lưu ý

* Sử dụng Python 3.10 hoặc mới hơn
* Cài đặt đầy đủ thư viện trong requirements.txt
* Đảm bảo model AI đã được huấn luyện
* Nếu sử dụng Blockchain cần cài MetaMask

---

# 🧠 7. Mô hình AI sử dụng

### CNN (Convolutional Neural Network)

Mô hình CNN được sử dụng để:

* Trích xuất đặc trưng hình ảnh
* Phân loại các loại hoa quả
* Tăng độ chính xác nhận diện
* Giảm nhiễu trong dữ liệu ảnh

Quy trình hoạt động:

```text
Ảnh đầu vào
      ↓
Tiền xử lý ảnh
      ↓
Mô hình CNN
      ↓
Dự đoán nhãn
      ↓
Hiển thị kết quả
      ↓
Lưu Blockchain
```

---

# 🔗 8. Ứng dụng Blockchain

Blockchain được sử dụng để:

* Lưu thông tin nhận diện
* Xác thực dữ liệu
* Chống chỉnh sửa dữ liệu trái phép
* Truy xuất lịch sử nhận diện

Thông tin lưu trữ:

* Tên hoa quả
* Thời gian nhận diện
* Kết quả dự đoán
* Mã giao dịch Blockchain

---

# 🚀 9. Hướng phát triển tương lai

* Nhận diện nhiều loại hoa quả hơn
* Tăng độ chính xác AI
* Tích hợp Camera thời gian thực
* Triển khai trên Cloud
* Xây dựng ứng dụng Mobile
* Kết nối Blockchain thực tế
* Truy xuất nguồn gốc nông sản

---

# 👨‍💻 10. Thông tin sinh viên

* **Họ và tên:** Bùi Anh Tuấn
* **Lớp:** CNTT 16-03
* **Khoa:** Công nghệ Thông tin
* **Trường:** Đại học Đại Nam

---

# 📌 11. Kết luận

Đề tài **Nhận Diện Hoa Quả Và Ứng Dụng Blockchain** giúp sinh viên tiếp cận các công nghệ hiện đại như **AI, Deep Learning, Computer Vision và Blockchain**.

Thông qua dự án, sinh viên có cơ hội nghiên cứu và phát triển một hệ thống hoàn chỉnh từ xử lý ảnh, xây dựng mô hình học sâu cho đến triển khai ứng dụng web và lưu trữ dữ liệu trên blockchain.

---

<div align="center">

### 🌟 Nếu thấy dự án hữu ích hãy cho một Star trên GitHub 🌟

⭐ ⭐ ⭐ ⭐ ⭐

**© 2026 Faculty of Information Technology - DaiNam University**

</div>
