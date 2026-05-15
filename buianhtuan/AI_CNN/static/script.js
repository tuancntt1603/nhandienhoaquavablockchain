function uploadImage() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (file) {
    // Kiểm tra định dạng file
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validImageTypes.includes(file.type)) {
      showNotification('Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF)', 'error');
      return;
    }

    // Kiểm tra kích thước file (giới hạn 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Hiển thị loading indicator
    document.getElementById("loadingIndicator").style.display = "block";
    document.getElementById("result").innerHTML = "";
    document.getElementById("imageResult").innerHTML = "";

    fetch("/predict", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Ẩn loading indicator
        document.getElementById("loadingIndicator").style.display = "none";

        if (data.error) {
          showNotification(`Lỗi: ${data.error}`, 'error');
        } else {
          // Hiển thị kết quả dự đoán
          const resultDiv = document.getElementById("result");
          resultDiv.innerHTML = `<h3 class="prediction-result">Dự đoán: ${data.prediction}</h3>`;
          resultDiv.classList.add("fade-in");

          // Hiển thị xác suất các lớp
          const probabilitiesDiv = document.createElement("div");
          probabilitiesDiv.innerHTML = "<h5>Mức độ phù hợp:</h5>";

          // Tạo bảng xác suất
          const table = document.createElement("table");
          table.className = "table table-bordered mt-2";
          table.innerHTML = `
            <thead>
              <tr>
                <th>Loại trái cây</th>
                <th>Mức độ phù hợp</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          `;

          // Danh sách tên trái cây và không phải trái cây - theo thứ tự thư mục
          const fruitNames = ['Chuối', 'Dâu tây', 'Dứa', 'Khế', 'Măng cụt', 'Không phải trái cây', 'Xoài'];

          // Thêm dữ liệu vào bảng
          const tbody = table.querySelector('tbody');
          data.probabilities.forEach((prob, index) => {
            // Sử dụng phần trăm chỉ cho thanh tiến trình, không hiển thị số
            const percentage = (prob * 100).toFixed(2);
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${fruitNames[index]}</td>
              <td>
                <div class="progress">
                  <div class="progress-bar ${index === data.probabilities.indexOf(Math.max(...data.probabilities)) ? 'bg-success' : 'bg-info'}"
                       role="progressbar"
                       style="width: ${percentage}%"
                       aria-valuenow="${percentage}"
                       aria-valuemin="0"
                       aria-valuemax="100">
                  </div>
                </div>
              </td>
            `;
            tbody.appendChild(row);
          });

          probabilitiesDiv.appendChild(table);
          resultDiv.appendChild(probabilitiesDiv);

          // Hiển thị thông tin dinh dưỡng
          const nutritionResultDiv = document.getElementById("nutritionResult");
          if (data.nutrition) {
              nutritionResultDiv.style.display = "block";
              nutritionResultDiv.innerHTML = `
                  <div class="card bg-dark text-white border-warning">
                      <div class="card-header bg-warning text-dark font-weight-bold">
                          <i class="fas fa-info-circle"></i> Thông tin dinh dưỡng: ${data.prediction}
                      </div>
                      <div class="card-body">
                          <div class="row text-left">
                              <div class="col-md-6">
                                  <p><strong>🔥 Calo:</strong> ${data.nutrition.calo}</p>
                                  <p><strong>🍞 Carbs:</strong> ${data.nutrition.carbs}</p>
                                  <p><strong>🥩 Protein:</strong> ${data.nutrition.protein}</p>
                              </div>
                              <div class="col-md-6">
                                  <p><strong>💧 Chất béo:</strong> ${data.nutrition.fat}</p>
                                  <p><strong>🍎 Vitamin:</strong> ${data.nutrition.vitamin}</p>
                              </div>
                          </div>
                          <hr class="bg-light">
                          <p class="text-left"><strong>🌟 Lợi ích:</strong> ${data.nutrition.benefit}</p>
                      </div>
                  </div>
              `;
          } else {
              nutritionResultDiv.style.display = "none";
          }

          // Hiển thị hình ảnh kết quả với hiệu ứng fade-in
          const imageResultDiv = document.getElementById("imageResult");
          const img = new Image();
          img.src = "data:image/png;base64," + data.image;
          img.alt = `Hình ảnh trái cây ${data.prediction}`;
          imageResultDiv.innerHTML = "";
          imageResultDiv.appendChild(img);

          // Thêm lớp fade-in cho hình ảnh
          img.classList.add("fade-in");

          // Web3 signature (nếu đã kết nối ví)
          if (userWalletAddress) {
              signDataOnBlockchain({
                  lot_id: 'PENDING',
                  fruit_type: data.prediction,
                  timestamp: new Date().toLocaleString(),
                  inspector: userWalletAddress
              }).then(sig => {
                  if (sig) showNotification("Dữ liệu đã được ký điện tử bởi ví của bạn!", "success");
              });
          }

          // Hiển thị thông báo thành công
          showNotification('Nhận dạng trái cây thành công!', 'success');
        }
      })
      .catch((error) => {
        // Ẩn loading indicator
        document.getElementById("loadingIndicator").style.display = "none";
        console.error("Lỗi:", error);
        showNotification("Tải lên hình ảnh và dự đoán thất bại.", 'error');
      });
  } else {
    showNotification("Vui lòng chọn một tệp hình ảnh để tải lên.", 'warning');
  }
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'info') {
  // Tạo thông báo
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} notification fade-in`;
  notification.innerHTML = `
    <span>${message}</span>
    <button type="button" class="close" onclick="this.parentElement.remove()">
      <span>&times;</span>
    </button>
  `;

  // Thêm vào body
  document.body.appendChild(notification);

  // Tự động ẩn sau 5 giây
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

function clearImage() {
  document.getElementById("fileInput").value = "";
  document.getElementById("result").innerHTML = "";
  document.getElementById("imageResult").innerHTML = "";
  document.getElementById("nutritionResult").style.display = "none";
  document.getElementById("nutritionResult").innerHTML = "";
  showNotification('Hình ảnh đã được xóa', 'info');
}

// Hàm bật camera
function startCamera() {
  // Hiển thị thông báo đang kết nối
  showNotification('Đang kết nối với camera...', 'info');

  // Gọi API để bật camera
  fetch("/toggle_camera", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "start" }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Camera status:", data.status);
      if (data.status === "Camera started") {
        // Hiển thị luồng video
        const cameraFeed = document.getElementById("cameraFeed");
        cameraFeed.src = "/video_feed";
        cameraFeed.style.display = "block";

        // Cập nhật trạng thái nút
        document.getElementById("startCamera").disabled = true;
        document.getElementById("stopCamera").disabled = false;
        document.getElementById("captureImage").disabled = false;

        // Hiển thị thông báo thành công
        showNotification('Camera đã được bật. Hướng camera vào trái cây để nhận dạng.', 'success');
      }
    })
    .catch((error) => {
      console.error("Lỗi khi bật camera:", error);
      showNotification(`Không thể kết nối với camera: ${error.message}`, 'error');
    });
}

// Hàm tắt camera
function stopCamera() {
  // Gọi API để tắt camera
  fetch("/toggle_camera", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "stop" }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Camera status:", data.status);
      if (data.status === "Camera stopped") {
        // Ẩn luồng video
        const cameraFeed = document.getElementById("cameraFeed");
        cameraFeed.style.display = "none";
        cameraFeed.src = "";

        // Cập nhật trạng thái nút
        document.getElementById("startCamera").disabled = false;
        document.getElementById("stopCamera").disabled = true;
        document.getElementById("captureImage").disabled = true;

        // Xóa kết quả
        document.getElementById("cameraResult").innerHTML = "";

        // Hiển thị thông báo
        showNotification('Camera đã được tắt', 'info');
      }
    })
    .catch((error) => {
      console.error("Lỗi khi tắt camera:", error);
      showNotification(`Không thể tắt camera: ${error.message}`, 'error');
    });
}

// Hàm tải lịch sử nhận diện
function loadHistory() {
    const tableBody = document.getElementById("historyTableBody");
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải lịch sử...</td></tr>';

    fetch("/get_history")
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = "";
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có lịch sử nhận diện.</td></tr>';
                return;
            }

            data.forEach((item, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td class="align-middle">${item.timestamp}</td>
                    <td class="align-middle">
                        <img src="data:image/png;base64,${item.image}" style="width: 80px; height: auto; border-radius: 5px; border: 1px solid #ddd;">
                    </td>
                    <td class="align-middle font-weight-bold">${item.prediction}</td>
                    <td class="align-middle">
                        <span class="badge badge-success">${item.confidence}</span>
                    </td>
                    <td class="align-middle">
                        <button class="btn btn-outline-danger btn-sm" onclick="deleteHistoryEntry(${index})">
                            <i class="fas fa-trash-alt"></i> Xóa
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Lỗi khi tải lịch sử:", error);
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Lỗi khi tải dữ liệu.</td></tr>';
        });
}

function deleteHistoryEntry(index) {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;

    fetch(`/delete_history/${index}`, {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Đã xóa thành công', 'success');
            loadHistory(); // Tải lại bảng
        } else {
            showNotification(`Lỗi: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error("Lỗi khi xóa:", error);
        showNotification("Không thể xóa mục này.", 'error');
    });
}

function clearHistory() {
    if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử của mình? Hành động này không thể hoàn tác!')) return;

    fetch("/clear_history", {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Đã xóa toàn bộ lịch sử', 'success');
            loadHistory(); // Tải lại bảng
        } else {
            showNotification(`Lỗi: ${data.message}`, 'error');
        }
    })
    .catch(error => {
        console.error("Lỗi khi xóa sạch:", error);
        showNotification("Không thể xóa toàn bộ lịch sử.", 'error');
    });
}

// Hàm tải Blockchain
function loadBlockchain() {
    const blockchainContent = document.getElementById("blockchainContent");
    const blockchainStatus = document.getElementById("blockchainStatus");
    
    blockchainContent.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p class="mt-3">Đang đồng bộ chuỗi khối...</p></div>';

    fetch("/get_blockchain")
        .then(response => response.json())
        .then(data => {
            // Hiển thị trạng thái chain
            if (data.is_valid) {
                blockchainStatus.innerHTML = '<span class="badge badge-success px-3 py-2"><i class="fas fa-check-circle"></i> Chuỗi khối Hợp lệ</span>';
            } else {
                blockchainStatus.innerHTML = '<span class="badge badge-danger px-3 py-2"><i class="fas fa-exclamation-triangle"></i> Cảnh báo: Chuỗi bị thay đổi!</span>';
            }

            blockchainContent.innerHTML = "";
            
            // Đảo ngược chuỗi để block mới nhất lên trên
            const reversedChain = [...data.chain].reverse();
            
            reversedChain.forEach(block => {
                if (block.index === 0 && block.transactions.length === 0) {
                    // Skip empty genesis block for display or show it specially
                    const genesisDiv = document.createElement("div");
                    genesisDiv.className = "blockchain-block genesis-block mb-4";
                    genesisDiv.innerHTML = `
                        <div class="block-header">Genesis Block #0</div>
                        <div class="block-body">
                            <p class="mb-0 text-muted">Hệ thống khởi tạo lúc: ${new Date(block.timestamp * 1000).toLocaleString()}</p>
                            <p class="small text-truncate mb-0">Hash: ${block.hash}</p>
                        </div>
                    `;
                    blockchainContent.appendChild(genesisDiv);
                    return;
                }

                const blockDiv = document.createElement("div");
                blockDiv.className = "blockchain-block mb-4";
                
                let transactionsHtml = "";
                block.transactions.forEach(tx => {
                    transactionsHtml += `
                        <div class="transaction-item p-3 mb-2 bg-dark-glass rounded">
                            <div class="d-flex justify-content-between">
                                <span class="text-warning font-weight-bold">${tx.fruit_type}</span>
                                <span class="badge badge-primary">${tx.confidence}</span>
                            </div>
                            <div class="small mt-2">
                                <div><i class="fas fa-barcode"></i> Lô hàng: ${tx.lot_id}</div>
                                <div><i class="fas fa-map-marker-alt"></i> Nguồn gốc: ${tx.origin}</div>
                                <div><i class="fas fa-user-check"></i> Kiểm định: ${tx.inspector}</div>
                                <div class="text-muted"><i class="far fa-clock"></i> ${tx.timestamp}</div>
                            </div>
                        </div>
                    `;
                });

                blockDiv.innerHTML = `
                    <div class="block-header d-flex justify-content-between">
                        <span>Block #${block.index}</span>
                        <span class="small opacity-75">${new Date(block.timestamp * 1000).toLocaleString()}</span>
                    </div>
                    <div class="block-body">
                        <div class="mb-2"><i class="fas fa-exchange-alt"></i> Giao dịch:</div>
                        ${transactionsHtml}
                        <div class="hash-info mt-3 pt-2 border-top border-secondary">
                            <div class="text-truncate small text-success">Current Hash: ${block.hash}</div>
                            <div class="text-truncate small text-muted">Prev Hash: ${block.previous_hash}</div>
                        </div>
                    </div>
                `;
                blockchainContent.appendChild(blockDiv);
            });
        })
        .catch(error => {
            console.error("Lỗi khi tải blockchain:", error);
            blockchainContent.innerHTML = '<div class="alert alert-danger">Lỗi khi tải dữ liệu blockchain.</div>';
        });
}

function captureImage() {
    const captureBtn = document.getElementById("captureImage");
    const originalText = captureBtn.innerHTML;
    captureBtn.disabled = true;
    captureBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

    fetch("/capture", {
        method: "POST"
    })
    .then(response => response.json())
    .then(data => {
        captureBtn.disabled = false;
        captureBtn.innerHTML = originalText;
        
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            showNotification(`Đã lưu nhận diện: ${data.prediction} (${data.confidence})`, 'success');
            
            // Web3 signature (nếu đã kết nối ví)
            if (userWalletAddress) {
                signDataOnBlockchain({
                    lot_id: 'PENDING',
                    fruit_type: data.prediction,
                    timestamp: new Date().toLocaleString(),
                    inspector: userWalletAddress
                });
            }

            // Hiển thị kết quả lên màn hình camera
            const cameraResultDiv = document.getElementById("cameraResult");
            cameraResultDiv.innerHTML = `
                <div class="card bg-success text-white mt-3">
                    <div class="card-body">
                        <h4 class="card-title"><i class="fas fa-check-circle"></i> Đã lưu vào lịch sử</h4>
                        <p class="card-text">Kết quả: <strong>${data.prediction}</strong></p>
                        <p class="card-text">Độ tin cậy: ${data.confidence}</p>
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        captureBtn.disabled = false;
        captureBtn.innerHTML = originalText;
        console.error("Lỗi khi chụp ảnh:", error);
        showNotification("Không thể chụp ảnh.", 'error');
    });
}

// Biến cho Dashboard
let fruitChart = null;
let userWalletAddress = null;

// Hàm tải Dashboard
function loadDashboard() {
    const totalEl = document.getElementById("totalInspections");
    const summaryEl = document.getElementById("statsSummary");
    
    fetch("/get_stats")
        .then(response => response.json())
        .then(data => {
            totalEl.innerText = data.total;
            
            // Cập nhật summary list
            summaryEl.innerHTML = "";
            const labels = [];
            const counts = [];
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
            ];

            Object.entries(data.counts).forEach(([fruit, count], index) => {
                labels.push(fruit);
                counts.push(count);
                
                const item = document.createElement("div");
                item.className = "d-flex justify-content-between mb-2";
                item.innerHTML = `
                    <span><i class="fas fa-circle" style="color: ${colors[index % colors.length]}"></i> ${fruit}</span>
                    <span class="badge badge-pill badge-light">${count}</span>
                `;
                summaryEl.appendChild(item);
            });

            // Vẽ biểu đồ
            const ctx = document.getElementById('fruitPieChart').getContext('2d');
            if (fruitChart) fruitChart.destroy();
            
            fruitChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: counts,
                        backgroundColor: colors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        });
}

// === WEB3 INTEGRATION ===

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userWalletAddress = accounts[0];
            
            const btn = document.getElementById("connectWallet");
            const addrSpan = document.getElementById("walletAddress");
            
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Đã kết nối';
            btn.className = "btn btn-success btn-sm";
            
            addrSpan.innerText = `${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(38)}`;
            addrSpan.style.display = "inline";
            
            showNotification("Đã kết nối ví MetaMask!", "success");
        } catch (error) {
            console.error(error);
            showNotification("Từ chối kết nối ví.", "error");
        }
    } else {
        showNotification("Vui lòng cài đặt MetaMask!", "warning");
    }
}

async function signDataOnBlockchain(data) {
    if (!userWalletAddress) return null;
    
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // Tạo message để ký (mô phỏng việc xác thực dữ liệu nguồn gốc)
        const message = `Xác thực nguồn gốc FruitAI:
Lô hàng: ${data.lot_id}
Loại quả: ${data.fruit_type}
Thời gian: ${data.timestamp}
Người kiểm định: ${data.inspector}`;

        const signature = await signer.signMessage(message);
        console.log("Signature:", signature);
        showNotification("Dữ liệu đã được ký điện tử bởi ví của bạn!", "success");
        return signature;
    } catch (error) {
        console.error("Web3 Error:", error);
        return null;
    }
}

// Khi chuyển tab, tắt camera nếu đang bật
document.addEventListener("DOMContentLoaded", function() {
  // Lắng nghe sự kiện chuyển tab
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    // Nếu chuyển khỏi tab camera, tắt camera
    if (e.relatedTarget && e.relatedTarget.id === "camera-tab") {
      // Kiểm tra nếu camera đang bật (nút stop đang enabled)
      if (!document.getElementById("stopCamera").disabled) {
        stopCamera();
      }
    }
  });

  // Thêm sự kiện cho file input để hiển thị tên file đã chọn và xem trước ảnh
  document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      showNotification(`Đã chọn file: ${file.name}`, 'info');
      
      // Hiển thị ảnh xem trước
      const reader = new FileReader();
      reader.onload = function(event) {
        const imageResultDiv = document.getElementById("imageResult");
        imageResultDiv.innerHTML = `
          <p class="text-muted mb-2">Ảnh đã chọn:</p>
          <img src="${event.target.result}" class="fade-in" style="max-width: 100%; border-radius: 20px; border: 2px solid var(--primary);">
        `;
      };
      reader.readAsDataURL(file);
    }
  });

  // Thêm CSS cho thông báo
  const style = document.createElement('style');
  style.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      min-width: 300px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      border-left: 5px solid;
      animation: slideIn 0.5s forwards;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .fade-out {
      animation: fadeOut 0.5s forwards;
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    .prediction-result {
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .progress {
      height: 20px;
      border-radius: 10px;
      background: rgba(255,255,255,0.2);
    }

    .progress-bar {
      border-radius: 10px;
    }

    .table {
      color: white;
      background: rgba(0,0,0,0.3);
    }

    .table th {
      background: rgba(0,0,0,0.5);
      color: white;
    }

    /* Blockchain Styles */
    .blockchain-block {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.3s;
    }

    .blockchain-block:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.08);
    }

    .block-header {
      background: linear-gradient(90deg, var(--primary), #6366f1);
      padding: 10px 15px;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
    }

    .block-body {
      padding: 15px;
    }

    .bg-dark-glass {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .transaction-item {
      border-left: 3px solid var(--warning);
    }

    .genesis-block .block-header {
      background: #4b5563;
    }

    .opacity-75 { opacity: 0.75; }

    .stats-card {
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `;
  document.head.appendChild(style);
});
