import numpy as np
import tensorflow as tf
import os
import datetime
from keras_preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, TensorBoard, ReduceLROnPlateau

# Tạo các biến xử lý dữ liệu đầu vào với nhiều kỹ thuật tăng cường dữ liệu
train_image = ImageDataGenerator(
    # Chuẩn hóa dữ liệu
    rescale=1./255,
    validation_split=0.2,        # Tự động chia 20% dữ liệu để kiểm thử

    # Các kỹ thuật tăng cường dữ liệu
    rotation_range=40,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest',
    brightness_range=[0.8, 1.2],
    channel_shift_range=0.1
)

val_image = ImageDataGenerator(rescale=1./255)

# Dữ liệu huấn luyện (80% dữ liệu từ train1)
training = train_image.flow_from_directory('nn/train1',
                                          target_size=(128, 128),
                                          batch_size=16,
                                          class_mode='categorical',
                                          subset='training',
                                          shuffle=True,
                                          seed=42)

# Dữ liệu validation (20% dữ liệu từ train1)
validation = train_image.flow_from_directory('nn/train1',
                                          target_size=(128, 128),
                                          batch_size=16,
                                          class_mode='categorical',
                                          subset='validation',
                                          shuffle=False,
                                          seed=42)

# Danh sách các lớp, bao gồm "Không phải trái cây" - theo thứ tự thư mục
classes = ['Chuối', 'Dâu tây', 'Dứa', 'Khế', 'Măng cụt', 'Không phải trái cây', 'Xoài']

# Xây dựng mô hình CNN sử dụng kiến trúc MobileNetV2 với các cải tiến
# MobileNetV2 là một kiến trúc CNN được thiết kế để chạy hiệu quả trên các thiết bị di động
# Tạo base model CNN từ MobileNetV2
create_base_model = tf.keras.applications.MobileNetV2(input_shape=(128, 128, 3), include_top=False, weights='imagenet')
create_base_model.trainable = False  # Đóng băng các tầng CNN pre-trained

model = tf.keras.Sequential([
    # Sử dụng MobileNetV2 làm base model
    create_base_model,

    # Thêm các lớp mới với các cải tiến
    tf.keras.layers.GlobalAveragePooling2D(),

    # Thêm các lớp fully connected với dropout và batch normalization
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.5),  # Thêm Dropout để tránh overfitting

    # Thêm một lớp Dense nữa
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),

    # Output layer
    tf.keras.layers.Dense(len(classes), activation='softmax')  # Số lớp đầu ra bằng số lớp trong danh sách
])

# Biên dịch mô hình với các tham số tối ưu
# Sử dụng Adam optimizer với learning rate giảm dần
learning_rate = 0.001
decay_rate = learning_rate / 20  # Giảm learning rate sau mỗi epoch
optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate, decay=decay_rate)

# Biên dịch mô hình
model.compile(
    optimizer=optimizer,
    loss='categorical_crossentropy',
    metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
)

# Huấn luyện mô hình
history = model.fit(
    training,
    epochs=20,                # Số epoch cố định
    validation_data=validation, # Sử dụng dữ liệu validation đã tạo
    verbose=1                 # Hiển thị tiến trình huấn luyện
)

# Vẽ biểu đồ quá trình huấn luyện
def plot_training_history(history):
    import matplotlib.pyplot as plt

    # Vẽ độ chính xác
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Accuracy over epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()

    # Vẽ loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Loss over epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()

    plt.tight_layout()
    plt.savefig('training_history.png')  # Lưu biểu đồ thành file ảnh
    plt.show()

# Vẽ biểu đồ quá trình huấn luyện
try:
    plot_training_history(history)
except Exception as e:
    print(f"Không thể vẽ biểu đồ: {e}")

# Lưu mô hình sau khi huấn luyện
model.save('fruitsuccess1_model.keras')  # Lưu mô hình cuối cùng

# In ra ánh xạ giữa chỉ số và tên lớp
print("\nÁnh xạ giữa chỉ số và tên lớp trong test1:")
print(validation.class_indices)

# Đánh giá mô hình trên dữ liệu test1
def test1():
    # Tạo bảng ánh xạ từ chỉ số sang tên lớp
    class_indices = validation.class_indices
    class_mapping = {v: k for k, v in class_indices.items()}

    # Đánh giá mô hình
    test_loss, test_accuracy = model.evaluate(validation)
    print(f"\nKết quả đánh giá trên tập test1:")
    print(f"\u0110ộ chính xác: {test_accuracy*100:.2f}%")
    print(f"Lỗi: {test_loss:.4f}")

    # Dự đoán trên tập test
    predictions = model.predict(validation)
    predicted_classes = np.argmax(predictions, axis=1)
    true_classes = validation.classes

    # Hiển thị một số dự đoán
    print("\nMột số kết quả dự đoán:")
    for i in range(min(5, len(predicted_classes))):
        pred_class_name = class_mapping[predicted_classes[i]]
        true_class_name = class_mapping[true_classes[i]]
        print(f"Hình ảnh {i+1}: Dự đoán: {pred_class_name}, Thực tế: {true_class_name}")

    return test_accuracy

# Hàm test để kiểm tra mô hình với một ảnh
def test_single_image(image_path):
    from keras_preprocessing import image
    import numpy as np

    # Tạo bảng ánh xạ từ chỉ số sang tên lớp
    class_indices = validation.class_indices
    class_mapping = {v: k for k, v in class_indices.items()}

    # Tải và chuẩn bị ảnh
    img = image.load_img(image_path, target_size=(128, 128))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0

    # Dự đoán
    predictions = model.predict(img_array)
    predicted_class = np.argmax(predictions[0])
    confidence = np.max(predictions[0]) * 100

    # Lấy tên lớp từ chỉ số dự đoán
    predicted_class_name = class_mapping[predicted_class]

    # Hiển thị kết quả
    print(f"Kết quả nhận dạng: {predicted_class_name} (index: {predicted_class})")
    print(f"Độ tin cậy: {confidence:.2f}%")

    return predicted_class_name, confidence