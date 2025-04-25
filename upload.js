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



async function fetchGalleryImages() {
    const owner = 'Apollohzl';
    const repo = 'UserImg';
    const path = 'upphotos';
    const password = 'MySecretPassword123!Apollohzl';
    const encrypted = '23f846e78d8e0a739dc449596IgP9MZO2asFcIRFFqxjkiZQZyG2GHu/GoAxC7oywoeLQ3hWYUG2IN3Xd0oJ0CQ4jP5WpA+Wgov8LnZJotArQd4dwUVAx0hA5lsNeg3TrtoIRcwSookmfF4nr/Xp+Nr725YJjFhMv1/Taoljwg==';
    const token = await decrypt(encrypted, password);
    console.log(token);
    
    try {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json'
            }
        });
        
        if (!response.ok) {
            throw new Error('获取图片列表失败');
        }
        
        const files = await response.json();
        const imageBox = document.getElementById('imgbox');
        imageBox.innerHTML = ''; // 清空现有内容
        
        // 过滤出图片文件
        const imageFiles = files.filter(file => 
            file.type === 'file' && 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
        );
        
        // 获取模态框元素
        const modal = document.getElementById("imageModal");
        const modalImg = document.getElementById("modalImage");
        const captionText = document.getElementById("caption");
        const closeBtn = document.getElementsByClassName("close")[0];
        
        // 关闭模态框
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
        
        // 点击模态框外部关闭
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
        
        // 为每个图片创建元素
        imageFiles.forEach(file => {
            const img = document.createElement('img');
            img.src = file.download_url;
            img.alt = file.name;
            img.className = 'img-item';
            
            // 点击事件 - 显示放大图片
            img.addEventListener('click', function() {
                modal.style.display = "block";
                modalImg.src = this.src;
                captionText.innerHTML = this.alt;
            });
            
            imageBox.appendChild(img);
        });
        
    } catch (error) {
        console.error('加载图库出错:', error);
        document.getElementById('imgbox').innerHTML = 
            '<p>加载图片失败，请刷新页面重试</p>';
    }
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
                // 上传成功后刷新图库
                await fetchGalleryImages();
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

async function uploadToGitHub(filename, content, fileType) {
    // GitHub API配置 - 替换为你的信息
    // 使用示例
    
    const owner = 'Apollohzl';
    const repo = 'UserImg';
    const branch = 'main';
    const token = decrypted;
    
    // API端点
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/upphotos/${encodeURIComponent(filename)}`;
    
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
// 页面加载时获取图库图片
window.addEventListener('DOMContentLoaded', fetchGalleryImages);