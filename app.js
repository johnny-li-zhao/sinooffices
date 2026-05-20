// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
menuToggle.addEventListener('click', function() {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mobileMenu.classList.toggle('hidden');
});

// Navbar Scroll Effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('py-2', 'shadow-lg');
        navbar.classList.remove('py-4');
    } else {
        navbar.classList.add('py-4');
        navbar.classList.remove('py-2', 'shadow-lg');
    }
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 80,
                behavior: 'smooth'
            });
            // Close mobile menu if open
            document.getElementById('mobile-menu').classList.add('hidden');
        }
    });
});

// ============================================================
// 联系表单 - 防恶意提交 & 验证
// ============================================================
(function() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nameInput = document.getElementById('form-name');
    const emailInput = document.getElementById('form-email');
    const messageInput = document.getElementById('form-message');
    const submitBtn = document.getElementById('form-submit');
    const honeypot = form.querySelector('input[name="website"]');
    
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const messageError = document.getElementById('message-error');
    const successMsg = document.getElementById('form-success');
    const errorMsg = document.getElementById('form-error-msg');

    // 表单加载时间戳，防止机器人秒提交
    const formLoadTime = Date.now();
    const MIN_SUBMIT_TIME = 3000; // 最少3秒后才能提交
    
    // 提交间隔限制 (同一浏览器)
    const RATE_LIMIT_KEY = 'contact_form_last_submit';
    const RATE_LIMIT_INTERVAL = 60000; // 60秒内只能提交一次

    // 邮箱正则
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    // 输入清理：去除HTML标签
    function sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML.trim();
    }

    // 清除错误状态
    function clearErrors() {
        [nameError, emailError, messageError].forEach(el => el.classList.add('hidden'));
        nameInput.classList.remove('border-red-400');
        emailInput.classList.remove('border-red-400');
        messageInput.classList.remove('border-red-400');
        successMsg.classList.add('hidden');
        errorMsg.classList.add('hidden');
    }

    // 显示字段错误
    function showFieldError(input, errorEl) {
        errorEl.classList.remove('hidden');
        input.classList.add('border-red-400');
    }

    // 邮箱校验
    function validateEmail(email) {
        return EMAIL_REGEX.test(email);
    }

    // 提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();

        // === 第1层：Honeypot 检测 ===
        if (honeypot && honeypot.value.trim() !== '') {
            // 机器人填了隐藏字段，静默拒绝（假装成功）
            successMsg.classList.remove('hidden');
            form.reset();
            return;
        }

        // === 第2层：提交时间检测 ===
        const elapsed = Date.now() - formLoadTime;
        if (elapsed < MIN_SUBMIT_TIME) {
            errorMsg.classList.remove('hidden');
            return;
        }

        // === 第3层：频率限制 ===
        const lastSubmit = localStorage.getItem(RATE_LIMIT_KEY);
        if (lastSubmit && (Date.now() - parseInt(lastSubmit)) < RATE_LIMIT_INTERVAL) {
            const remaining = Math.ceil((RATE_LIMIT_INTERVAL - (Date.now() - parseInt(lastSubmit))) / 1000);
            errorMsg.querySelector('p').textContent = '请等待 ' + remaining + ' 秒后再提交。';
            errorMsg.classList.remove('hidden');
            return;
        }

        // === 第4层：字段验证 ===
        const name = sanitize(nameInput.value.trim());
        const email = sanitize(emailInput.value.trim());
        const message = sanitize(messageInput.value.trim());

        let hasError = false;

        if (!name || name.length < 1) {
            showFieldError(nameInput, nameError);
            hasError = true;
        } else if (name.length > 100) {
            showFieldError(nameInput, nameError);
            hasError = true;
        }

        if (!email) {
            showFieldError(emailInput, emailError);
            hasError = true;
        } else if (!validateEmail(email)) {
            showFieldError(emailInput, emailError);
            hasError = true;
        } else if (email.length > 254) {
            showFieldError(emailInput, emailError);
            hasError = true;
        }

        if (!message || message.length < 1) {
            showFieldError(messageInput, messageError);
            hasError = true;
        } else if (message.length > 5000) {
            showFieldError(messageInput, messageError);
            hasError = true;
        }

        if (hasError) return;

        // === 第5层：禁用按钮防重复提交 ===
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';

        // === 提交 ===
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('message', message);
            formData.append('lang', localStorage.getItem('preferredLang') || 'en');
            formData.append('timestamp', Date.now().toString());
            formData.append('source', window.location.href);

            const response = await fetch('https://en.officezy.com/sendmail/index.php', {
                method: 'POST',
                body: formData,
                // 不使用 CORS credentials，不需要cookie
                mode: 'no-cors'
            });

            // no-cors模式下无法读取响应状态，但fetch不会抛异常即视为成功
            localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
            successMsg.classList.remove('hidden');
            form.reset();
        } catch (err) {
            console.error('Form submission error:', err);
            errorMsg.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = document.querySelector('[data-i18n="formSubmit"]')
                ? document.querySelector('[data-i18n="formSubmit"]').textContent
                : submitBtn.getAttribute('data-original-text') || '提交咨询 / Submit';
        }
    });

    // 实时清除单字段错误
    [nameInput, emailInput, messageInput].forEach(function(input) {
        input.addEventListener('input', function() {
            input.classList.remove('border-red-400');
        });
    });
})();