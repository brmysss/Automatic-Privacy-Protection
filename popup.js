const correctPassword = "your_password_here"; // 设置您的密码

function checkWhitelist(url) {
    const whitelist = [
        "about:blank",
        "chrome://",
        "edge://",
    ]

    for (const u of whitelist) {
        if (url.includes(u)) {
            return true;
        }
    }

    return false;
}

document.addEventListener('DOMContentLoaded', function() {
    const passwordSetup = document.getElementById('password-setup');
    const passwordPrompt = document.getElementById('password-prompt');
    const content = document.getElementById('content');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const savePasswordButton = document.getElementById('save-password');
    const passwordInput = document.getElementById('password-input');
    const submitPassword = document.getElementById('submit-password');
    const resetPassword = document.getElementById('reset-password');

    // 检查是否已设置密码
    chrome.storage.sync.get(['password'], function(result) {
        if (result.password) {
            passwordPrompt.style.display = 'block';
        } else {
            passwordSetup.style.display = 'block';
        }
    });

    // 保存新密码
    savePasswordButton.addEventListener('click', function() {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            alert('两次输入的密码不一致，请重新输入。');
            return;
        }

        chrome.storage.sync.set({password: newPassword}, function() {
            passwordSetup.style.display = 'none';
            content.style.display = 'block';
            loadBlacklist();
        });
    });

    // 验证密码
    submitPassword.addEventListener('click', function() {
        chrome.storage.sync.get(['password'], function(result) {
            if (passwordInput.value === result.password) {
                passwordPrompt.style.display = 'none';
                content.style.display = 'block';
                loadBlacklist();
            } else {
                alert('密码错误!');
            }
        });
    });

    // 重置密码
    resetPassword.addEventListener('click', function() {
        if (confirm('确定要重置密码吗？这将清除所有设置。')) {
            chrome.storage.sync.clear(function() {
                passwordPrompt.style.display = 'none';
                passwordSetup.style.display = 'block';
            });
        }
    });

    // 其余代码保持不变...
});

function loadBlacklist() {
    // 将原有的加载黑名单和其他功能的代码移到这个函数中
    displayBlacklist();
}

document.getElementById('addCurrentTabButton').addEventListener('click', function () {
    // 获取当前活动的标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length <= 0) {
            return;
        }

        const url = tabs[0].url; // 获取当前标签的 URL
        const hostname = new URL(url).hostname; // 提取域名

        if (checkWhitelist(url)) {
            return;
        }

        // 提取一级域名
        const parts = hostname.split('.');
        const tld = parts.pop(); // 顶级域名
        const secondLevelDomain = parts.pop(); // 第二级域名
        const primaryDomain = secondLevelDomain + '.' + tld; // 组合成一级域名

        // 将一级域名添加到黑名单
        chrome.storage.sync.get(['blacklist'], function (result) {
            const blacklist = result.blacklist || [];
            if (!blacklist.includes(primaryDomain)) { // 检查是否已存在
                blacklist.push(primaryDomain);
                chrome.storage.sync.set({ blacklist }, displayBlacklist);

                chrome.tabs.reload(tabs[0].id)
            }
        });
    });
});

// 现有的添加网址到黑名单的代码...
document.getElementById('addButton').addEventListener('click', function () {
    const urlInput = document.getElementById('urlInput').value.trim();
    if (!urlInput) {
        return;
    }

    chrome.storage.sync.get(['blacklist'], function (result) {
        const blacklist = result.blacklist || [];
        if (!blacklist.includes(urlInput)) {
            blacklist.push(urlInput);
            chrome.storage.sync.set({ blacklist }, displayBlacklist);
        }
    });
});

// 显示黑名单
function displayBlacklist() {
    chrome.storage.sync.get(['blacklist'], function (result) {
        const blacklist = result.blacklist || [];
        const blacklistElement = document.getElementById('blacklist');
        blacklistElement.innerHTML = '';
        blacklist.forEach(url => {
            const li = document.createElement('li');
            li.textContent = url;
            li.addEventListener('click', function () {
                removeFromBlacklist(url);
            });
            blacklistElement.appendChild(li);
        });
    });
}

function removeFromBlacklist(url) {
    chrome.storage.sync.get(['blacklist'], function (result) {
        let blacklist = result.blacklist || [];
        blacklist = blacklist.filter(item => item !== url);
        chrome.storage.sync.set({ blacklist }, displayBlacklist);
    });
}

// 初始显示黑名单
displayBlacklist();
