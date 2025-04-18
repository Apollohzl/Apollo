/**
 * 使用 AES-GCM 加密
 * @param {string} plaintext 
 * @param {string} password 
 * @returns {Promise<string>} base64编码的加密结果
 */
var decrypted = '';
async function encrypt(plaintext, password) {
    // 生成密钥从密码
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv: iv };
    
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);
    
    const ptUint8 = new TextEncoder().encode(plaintext);
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);
    
    const ctArray = Array.from(new Uint8Array(ctBuffer));
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');
    const ctBase64 = btoa(ctStr);
    
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    return ivHex + ctBase64;
}

/**
 * 使用 AES-GCM 解密
 * @param {string} ciphertext 
 * @param {string} password 
 * @returns {Promise<string>} 解密后的明文
 */
(async () => {
    const password = 'MySecretPassword123!Apollohzl';
    const encrypted = '23f846e78d8e0a739dc449596IgP9MZO2asFcIRFFqxjkiZQZyG2GHu/GoAxC7oywoeLQ3hWYUG2IN3Xd0oJ0CQ4jP5WpA+Wgov8LnZJotArQd4dwUVAx0hA5lsNeg3TrtoIRcwSookmfF4nr/Xp+Nr725YJjFhMv1/Taoljwg==';
    
    try {
        
        
        decrypted = await decrypt(encrypted, password);
        
        
    } catch (err) {
        console.error('加密/解密错误:', err);
    }
})();
async function decrypt(ciphertext, password) {
    const ivHex = ciphertext.substring(0, 24);
    const iv = new Uint8Array(ivHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    const ctBase64 = ciphertext.substring(24);
    
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
    
    const alg = { name: 'AES-GCM', iv: iv };
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);
    
    const ctStr = atob(ctBase64);
    const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
    
    return new TextDecoder().decode(plainBuffer);
}












document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('imageInput');
    const filenameInput = document.getElementById('filename');
    const statusDiv = document.getElementById('status');
    
    const file = fileInput.files[0];
    const filename = filenameInput.value.trim();
    
    if (!file || !filename) {
        statusDiv.textContent = '请选择图片并输入文件名';
        return;
    }
    
    // 检查文件大小（限制为25MB）
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
        statusDiv.textContent = '文件大小不能超过25MB';
        return;
    }
    
    // 获取文件扩展名
    const extension = file.name.split('.').pop();
    const fullFilename = `${filename}.${extension}`;
    
    // 读取文件为Base64
    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result.split(',')[1]; // 去掉data:image/...前缀
        
        try {
            statusDiv.textContent = '上传中...';
            
            // 调用GitHub API上传文件
            const response = await uploadToGitHub(fullFilename, content, file.type);
            
            if (response.content && response.content.download_url) {
                statusDiv.innerHTML = `上传成功!<br>
                                      <a href="${response.content.download_url}" target="_blank">查看图片</a>`;
            } else {
                const errorMsg = response.message || '未知错误';
                // 检查是否是API限制错误
                if (errorMsg.includes('too large')) {
                    statusDiv.textContent = '上传失败: 文件太大，GitHub限制为25MB以下';
                } else {
                    statusDiv.textContent = '上传失败: ' + errorMsg;
                }
            }
        } catch (error) {
            console.error('上传错误:', error);
            statusDiv.textContent = '上传出错: ' + (error.message || '请求失败');
        }
    };
    reader.onerror = function() {
        statusDiv.textContent = '文件读取失败';
    };
    reader.readAsDataURL(file);
});
const owner = 'Apollohzl';
const repo = 'Apollo';
const branch = 'main';
const token = decrypted;
async function uploadToGitHub(filename, content, fileType) {
    // GitHub API配置 - 替换为你的信息
    // 使用示例
    
    
    
    // API端点
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/upphotos/${encodeURIComponent(filename)}/${encodeURIComponent(filename)}`;
    
    // 请求头
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
    
    // 请求体
    const body = {
        message: `Upload image ${filename}`,
        content: content,
        branch: branch
    };
    
    // 发送PUT请求
    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'GitHub API请求失败');
    }
    
    return data;
}
const filePath = 'password.txt'; // 要创建的文件路径
const fileContent = document.getElementById('password').value; 
async function createFileOnGitHub() {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/upphotos/${encodeURIComponent(filename)}/password.txt`;
    
    // 将内容转换为 Base64
    const contentBase64 = btoa(unescape(encodeURIComponent(fileContent)));
    
    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
            message: '创建 password.txt 文件',
            content: contentBase64,
            branch: 'main' // 目标分支
        })
    });

    const data = await response.json();
    
    if (response.ok) {
        console.log('文件创建成功:', data);
        console.log('文件下载URL:', data.content.download_url);
        
        // 获取并返回文件的 sha ID（可以用于后续更新）
        const fileSha = data.content.sha;
        console.log('文件SHA ID:', fileSha);
        return fileSha;
    } else {
        throw new Error(`创建文件失败: ${data.message}`);
    }
}

// 调用函数
createFileOnGitHub()
    .then(sha => console.log('操作完成，文件SHA:', sha))
    .catch(error => console.error('出错:', error));