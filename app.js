let currentTestData = null;

async function loadTest(filename) {
    try {
        // Đã sửa lại đường dẫn, gọi trực tiếp file JSON vì nó đang nằm cùng cấp với app.js
        const response = await fetch(filename);
        if (!response.ok) throw new Error("Không thể tải dữ liệu");
        currentTestData = await response.json();
        
        // Đã sửa 'classlist' thành 'classList' (chữ L viết hoa)
        document.getElementById('menu-section').classList.add('hidden');
        document.getElementById('result-section').classList.add('hidden');
        document.getElementById('test-section').classList.remove('hidden');
        
        renderTest();
    } catch (error) {
        alert("Lỗi tải dữ liệu. Nếu bạn đang chạy file trực tiếp trên máy tính, hãy đẩy lên GitHub để test vì trình duyệt chặn đọc file nội bộ.");
    }
}

function goBack() {
    // Đã sửa 'classlist' thành 'classList'
    document.getElementById('menu-section').classList.remove('hidden');
    document.getElementById('test-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
}

function renderTest() {
    document.getElementById('test-title').innerText = currentTestData.title;
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    // Render Trắc nghiệm
    if (currentTestData.multiple_choice) {
        currentTestData.multiple_choice.forEach((q, index) => {
            let html = `<div class="question-block" id="block-${q.id}">
                <div class="question-title">Câu ${index + 1} (Trắc nghiệm): ${q.question}</div>`;
            q.options.forEach((opt, i) => {
                html += `<label class="option-label">
                    <input type="radio" name="${q.id}" value="${i}"> ${opt}
                </label>`;
            });
            html += `</div>`;
            container.innerHTML += html;
        });
    }

    // Render Tự luận
    if (currentTestData.text_input) {
        currentTestData.text_input.forEach((q, index) => {
            let num = currentTestData.multiple_choice ? currentTestData.multiple_choice.length + index + 1 : index + 1;
            let html = `<div class="question-block" id="block-${q.id}">
                <div class="question-title">Câu ${num} (Tự luận): ${q.question}</div>
                <textarea class="text-input" id="${q.id}" rows="3" placeholder="Nhập câu trả lời của bạn..."></textarea>
            </div>`;
            container.innerHTML += html;
        });
    }
}

function normalizeText(text) {
    if (!text) return "";
    return text.toLowerCase()
               .replace(/[.,!?]/g, "") // Bỏ dấu câu cơ bản
               .replace(/\s+/g, " ")   // Đưa khoảng trắng kép về 1 khoảng trắng
               .trim();
}

function submitTest() {
    let score = 0;
    let total = 0;
    let feedbackHTML = '';

    // Chấm điểm Trắc nghiệm
    if (currentTestData.multiple_choice) {
        total += currentTestData.multiple_choice.length;
        currentTestData.multiple_choice.forEach(q => {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            const userAnswer = selected ? parseInt(selected.value) : -1;
            
            if (userAnswer === q.correct_answer) {
                score++;
                feedbackHTML += `
                    <div class="result-item correct">
                        <div class="question-text">✔️ ${q.question}</div>
                        <div class="feedback-box"><strong>Chính xác!</strong></div>
                    </div>`;
            } else {
                let userText = selected ? q.options[userAnswer] : "(Bỏ trống)";
                feedbackHTML += `
                    <div class="result-item incorrect">
                        <div class="question-text">❌ ${q.question}</div>
                        <div class="feedback-box expected"><strong>Đáp án chuẩn:</strong> ${q.options[q.correct_answer]}</div>
                        <div class="feedback-box user"><strong>Bạn chọn:</strong> ${userText}</div>
                    </div>`;
            }
        });
    }

    // Chấm điểm Tự luận
    if (currentTestData.text_input) {
        total += currentTestData.text_input.length;
        currentTestData.text_input.forEach(q => {
            const userText = document.getElementById(q.id).value;
            const normalizedUser = normalizeText(userText);
            const normalizedExpected = normalizeText(q.expected_answer);

            if (normalizedUser === normalizedExpected || (normalizedUser.length > 5 && normalizedUser.includes(normalizedExpected))) {
                score++;
                feedbackHTML += `
                    <div class="result-item correct">
                        <div class="question-text">✔️ ${q.question}</div>
                        <div class="feedback-box"><strong>Chính xác!</strong></div>
                    </div>`;
            } else {
                feedbackHTML += `
                    <div class="result-item incorrect">
                        <div class="question-text">❌ ${q.question}</div>
                        <div class="feedback-box expected"><strong>Đáp án chuẩn:</strong> ${q.expected_answer}</div>
                        <div class="feedback-box user"><strong>Bạn nhập:</strong> ${userText || "(Bỏ trống)"}</div>
                    </div>`;
            }
        });
    }

    document.getElementById('test-section').classList.add('hidden');
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('score-display').innerHTML = `Điểm của bạn: <strong>${score} / ${total}</strong>`;
    document.getElementById('feedback-container').innerHTML = feedbackHTML;
    window.scrollTo(0, 0);
}

// Hàm làm lại bài hiện tại
function retryTest() {
    // Xóa trắng toàn bộ ô nhập tự luận
    const textInputs = document.querySelectorAll('.text-input');
    textInputs.forEach(input => input.value = '');
    
    // Bỏ chọn toàn bộ ô trắc nghiệm (nếu có)
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => input.checked = false);
    
    // Chuyển màn hình về lại bài kiểm tra
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    window.scrollTo(0, 0);
}