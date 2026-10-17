let currentTestData = null;

async function loadTest(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) throw new Error("Không thể tải dữ liệu");
        currentTestData = await response.json();
        
        document.getElementById('menu-section').classList.add('hidden');
        document.getElementById('result-section').classList.add('hidden');
        document.getElementById('test-section').classList.remove('hidden');
        
        renderTest();
    } catch (error) {
        console.error(error);
        alert("Lỗi tải dữ liệu. Hãy chắc chắn tên file JSON chính xác.");
    }
}

function goBack() {
    document.getElementById('menu-section').classList.remove('hidden');
    document.getElementById('test-section').classList.add('hidden');
    document.getElementById('result-section').classList.add('hidden');
}

function renderTest() {
    document.getElementById('test-title').innerText = currentTestData.title;
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

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
    return text.toString().toLowerCase()
               .replace(/[.,!?“”"':;\-]/g, "") 
               .replace(/\s+/g, " ")   
               .trim();
}

function checkMatch(userText, expectedData) {
    if (!expectedData) return false;
    const u = normalizeText(userText);
    if (u.length < 3) return false;

    let expectedArray = Array.isArray(expectedData) ? expectedData : [expectedData];
    
    for (let expected of expectedArray) {
        const e = normalizeText(expected);
        if (!e) continue;
        
        if (u === e || u.includes(e) || e.includes(u)) return true;
        
        let userWords = u.split(" ");
        let expectedWords = e.split(" ");
        
        // Lọc bỏ từ nối
        let ignoreWords = ["là", "của", "và", "có", "hay", "không", "thì", "mà", "các", "những", "cho", "để"];
        expectedWords = expectedWords.filter(w => !ignoreWords.includes(w) && w.length > 0);
        
        let matchCount = 0;
        expectedWords.forEach(word => {
            if (userWords.includes(word)) matchCount++;
        });
        
        if (expectedWords.length > 0 && (matchCount / expectedWords.length) >= 0.7) {
            return true;
        }
    }
    return false;
}

function submitTest() {
    try {
        let score = 0;
        let total = 0;
        let feedbackHTML = '';

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

        if (currentTestData.text_input) {
            total += currentTestData.text_input.length;
            currentTestData.text_input.forEach(q => {
                const userText = document.getElementById(q.id).value;
                
                if (checkMatch(userText, q.expected_answer)) {
                    score++;
                    feedbackHTML += `
                        <div class="result-item correct">
                            <div class="question-text">✔️ ${q.question}</div>
                            <div class="feedback-box"><strong>Chính xác!</strong></div>
                        </div>`;
                } else {
                    let expectedDisplay = Array.isArray(q.expected_answer) ? q.expected_answer.join(" <br><i>HOẶC:</i><br> ") : q.expected_answer;
                    
                    feedbackHTML += `
                        <div class="result-item incorrect">
                            <div class="question-text">❌ ${q.question}</div>
                            <div class="feedback-box expected"><strong>Đáp án chuẩn:</strong><br>${expectedDisplay}</div>
                            <div class="feedback-box user"><strong>Bạn nhập:</strong> ${userText || "(Bỏ trống)"}</div>
                        </div>`;
                }
            });
        }

        document.getElementById('test-section').classList.add('hidden');
        document.getElementById('result-section').classList.remove('hidden');
        
        const scoreDisplay = document.getElementById('score-display');
        const feedbackContainer = document.getElementById('feedback-container');
        
        if (scoreDisplay) scoreDisplay.innerHTML = `Điểm của bạn: <strong>${score} / ${total}</strong>`;
        if (feedbackContainer) feedbackContainer.innerHTML = feedbackHTML;
        
        window.scrollTo(0, 0);
    } catch (err) {
        console.error("Lỗi khi nộp bài:", err);
        alert("Có lỗi xảy ra khi chấm điểm! Hãy kiểm tra Console (F12).");
    }
}

function retryTest() {
    const textInputs = document.querySelectorAll('.text-input');
    textInputs.forEach(input => input.value = '');
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => input.checked = false);
    
    document.getElementById('result-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    window.scrollTo(0, 0);
}