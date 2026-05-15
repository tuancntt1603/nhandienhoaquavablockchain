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
                  lot_id: 'LOT-' + Date.now(),
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

// Hàm chuyển đổi giữa Local và On-chain Blockchain
function toggleBlockchainView(view) {
    const localBtn = document.getElementById("viewLocalChain");
    const onchainBtn = document.getElementById("viewOnChain");
    const localContent = document.getElementById("blockchainContent");
    const onchainContent = document.getElementById("onchainContent");
    const diagnostics = document.getElementById("blockchainDiagnostics");

    if (view === 'local') {
        localBtn.classList.add("active");
        onchainBtn.classList.remove("active");
        localContent.style.display = "block";
        onchainContent.style.display = "none";
        diagnostics.style.display = "none";
        loadBlockchain();
    } else {
        localBtn.classList.remove("active");
        onchainBtn.classList.add("active");
        localContent.style.display = "none";
        onchainContent.style.display = "block";
        diagnostics.style.display = "block";
        loadOnChainData();
    }
}

// Hàm chẩn đoán lỗi Blockchain tự động
async function diagnoseBlockchain() {
    const results = document.getElementById("diagnosticResults");
    results.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kiểm tra...';
    
    try {
        if (!window.ethereum) {
            results.innerHTML = '<span class="text-danger">Lỗi: Không tìm thấy ví MetaMask!</span>';
            return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        const address = await provider.getSigner().getAddress();
        const code = await provider.getCode(CONTRACT_ADDRESS);

        let html = `<ul class="list-unstyled mb-0">`;
        html += `<li><i class="fas fa-network-wired"></i> Mạng: <strong>${network.name} (ID: ${network.chainId})</strong> ${network.chainId === 11155111 ? '✅' : '❌ (Phải là 11155111)'}</li>`;
        html += `<li><i class="fas fa-wallet"></i> Ví của bạn: <strong>${address.substring(0,6)}...</strong></li>`;
        html += `<li><i class="fas fa-file-contract"></i> Contract Code: <strong>${code === '0x' ? '❌ TRỐNG (Không tìm thấy)' : '✅ ĐÃ CÓ (Hợp lệ)'}</strong></li>`;
        html += `<li><i class="fas fa-map-marker-alt"></i> Địa chỉ đang tìm: <strong>${CONTRACT_ADDRESS.substring(0,10)}...</strong></li>`;
        html += `</ul>`;

        if (code === '0x') {
            html += `<div class="alert alert-warning mt-2 p-1 small">Gợi ý: Địa chỉ này không tồn tại trên mạng ${network.name}. Bạn hãy kiểm tra xem đã chọn đúng Browser Extension trong Remix và ví MetaMask đã ở đúng mạng chưa.</div>`;
        } else if (network.chainId !== 11155111) {
            html += `<div class="alert alert-danger mt-2 p-1 small">
                Gợi ý: Bạn đang ở sai mạng! 
                <button class="btn btn-xs btn-primary ml-2" onclick="switchNetworkToSepolia()">Bấm vào đây để Chuyển sang Sepolia</button>
            </div>`;
            // Tự động yêu cầu chuyển mạng luôn
            switchNetworkToSepolia();
        } else {
            html += `<div class="alert alert-success mt-2 p-1 small">Mọi thứ có vẻ ổn! Hãy thử tải lại trang.</div>`;
        }

        results.innerHTML = html;
    } catch (e) {
        results.innerHTML = `<span class="text-danger">Lỗi kỹ thuật: ${e.message}</span>`;
    }
}

// Hàm tự động yêu cầu MetaMask chuyển sang mạng Sepolia
async function switchNetworkToSepolia() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // 0xaa36a7 là ID của Sepolia (11155111)
        });
    } catch (switchError) {
        // Nếu mạng Sepolia chưa được thêm vào MetaMask, yêu cầu thêm mạng luôn
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xaa36a7',
                        chainName: 'Sepolia Test Network',
                        nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
                        rpcUrls: ['https://sepolia.infura.io/v3/'],
                        blockExplorerUrls: ['https://sepolia.etherscan.io']
                    }],
                });
            } catch (addError) {
                console.error("Không thể thêm mạng Sepolia:", addError);
            }
        }
    }
}

// Hàm tải dữ liệu thực tế từ Smart Contract
async function loadOnChainData() {
    const onchainContent = document.getElementById("onchainContent");
    
    if (!userWalletAddress) {
        onchainContent.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-wallet"></i> Vui lòng kết nối ví MetaMask để đọc dữ liệu từ Smart Contract.
            </div>
        `;
        return;
    }

    if (!CONTRACT_ADDRESS) {
        onchainContent.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="fas fa-info-circle"></i> Chưa cấu hình địa chỉ Smart Contract trong script.js.
            </div>
        `;
        return;
    }

    onchainContent.innerHTML = '<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-3x text-primary"></i><p class="mt-3">Đang truy vấn Smart Contract...</p></div>';

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();

        // TỰ ĐỘNG FIX: Nếu sai mạng, yêu cầu chuyển mạng luôn
        if (network.chainId !== 11155111) {
            document.getElementById("networkAlert").style.display = "block";
            console.log("Sai mạng, đang yêu cầu chuyển sang Sepolia...");
            await switchNetworkToSepolia();
            // Sau khi chuyển mạng xong (hoặc đang chuyển), thông báo cho người dùng
            onchainContent.innerHTML = `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-sync fa-spin"></i> Đang chuyển sang mạng Sepolia... Vui lòng xác nhận trên MetaMask và tải lại trang.
                    <button class="btn btn-sm btn-primary mt-2 d-block mx-auto" onclick="location.reload()">Tải lại trang</button>
                </div>`;
            return;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        
        const count = await contract.getInspectionCount();
        const total = count.toNumber();

        if (total === 0) {
            onchainContent.innerHTML = '<div class="alert alert-info text-center">Chưa có bản ghi nào trên Smart Contract.</div>';
            return;
        }

        let html = '<div class="onchain-list">';
        
        // Lấy 10 bản ghi mới nhất (hoặc tất cả nếu ít hơn 10)
        const start = Math.max(0, total - 10);
        for (let i = total - 1; i >= start; i--) {
            const ins = await contract.getInspection(i);
            const date = new Date(ins[4].toNumber() * 1000).toLocaleString();
            
            html += `
                <div class="blockchain-block mb-3 border-left-onchain">
                    <div class="block-header d-flex justify-content-between" style="background: linear-gradient(90deg, #00c6ff, #0072ff);">
                        <span>On-chain Record #${i}</span>
                        <span class="small">${date}</span>
                    </div>
                    <div class="block-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h4 class="text-warning mb-0">${ins[1]}</h4>
                            <span class="badge badge-primary">${ins[2]} Confidence</span>
                        </div>
                        <div class="small">
                            <div><i class="fas fa-barcode"></i> Lô hàng: ${ins[0]}</div>
                            <div><i class="fas fa-map-marker-alt"></i> Nguồn gốc: ${ins[5]}</div>
                            <div class="text-truncate"><i class="fas fa-user-check"></i> Kiểm định viên: ${ins[3]}</div>
                        </div>
                        <div class="mt-2 pt-2 border-top border-secondary small text-success">
                            <i class="fas fa-check-double"></i> Verified by Smart Contract
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        onchainContent.innerHTML = html;
        
    } catch (error) {
        console.error("On-chain Read Error:", error);
        let errorMsg = error.message;
        if (error.code === 'CALL_EXCEPTION') {
            errorMsg = "Không tìm thấy Smart Contract tại địa chỉ này trên mạng hiện tại. Vui lòng kiểm tra xem bạn đã Deploy lên mạng Sepolia chưa và địa chỉ CONTRACT_ADDRESS trong script.js đã đúng chưa.";
        }
        onchainContent.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> ${errorMsg}</div>`;
    }
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
                    lot_id: 'LOT-' + Date.now(),
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

// === SMART CONTRACT CONFIGURATION ===
const CONTRACT_ADDRESS = "0xc7800A4D99597355128Ed4899F9cc611D10FC825"; // Địa chỉ Smart Contract thật của bạn
const CONTRACT_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "lotId",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "fruitType",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "confidence",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "inspector",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "origin",
				"type": "string"
			}
		],
		"name": "InspectionRecorded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "inspector",
				"type": "address"
			}
		],
		"name": "InspectorAuthorized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "inspector",
				"type": "address"
			}
		],
		"name": "InspectorRemoved",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_inspector",
				"type": "address"
			}
		],
		"name": "authorizeInspector",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "authorizedInspectors",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_index",
				"type": "uint256"
			}
		],
		"name": "getInspection",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_lotId",
				"type": "string"
			}
		],
		"name": "getInspectionByLot",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getInspectionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "inspections",
		"outputs": [
			{
				"internalType": "string",
				"name": "lotId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "fruitType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "confidence",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "inspector",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "origin",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "lotExists",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"name": "lotToIndex",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_lotId",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_fruitType",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_confidence",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_origin",
				"type": "string"
			}
		],
		"name": "recordInspection",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

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
        
        // 1. Ký thông điệp (Off-chain signature - Đã có sẵn)
        const message = `Xác thực nguồn gốc FruitAI:
Lô hàng: ${data.lot_id}
Loại quả: ${data.fruit_type}
Thời gian: ${data.timestamp}
Người kiểm định: ${data.inspector}`;

        const signature = await signer.signMessage(message);
        console.log("Signature:", signature);

        // 2. Ghi lên Smart Contract (On-chain transaction - MỚI)
        if (CONTRACT_ADDRESS) {
            await recordOnChain(data.lot_id, data.fruit_type, data.confidence || "99%", data.origin || "Vietnam");
        } else {
            showNotification("Dữ liệu đã được ký điện tử! (Chưa cấu hình Smart Contract để ghi on-chain)", "info");
        }

        return signature;
    } catch (error) {
        console.error("Web3 Error:", error);
        showNotification("Lỗi Web3: " + error.message, "error");
        return null;
    }
}

async function recordOnChain(lotId, fruitType, confidence, origin) {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        showNotification("Đang gửi giao dịch lên Blockchain...", "info");
        
        const tx = await contract.recordInspection(lotId, fruitType, confidence, origin);
        await tx.wait();
        
        showNotification("Giao dịch thành công! Dữ liệu đã được lưu vĩnh viễn trên Smart Contract.", "success");
    } catch (error) {
        console.error("On-chain Error:", error);
        showNotification("Lỗi ghi On-chain: " + (error.data?.message || error.message), "error");
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
