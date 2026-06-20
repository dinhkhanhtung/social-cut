// --- ZIP Helper Module ---
import { state, elements } from './state.js';
import { showToast } from './ui-helpers.js';

export function downloadZip() {
    if (state.slicedBlobs.length === 0) {
        showToast('Không có ảnh kết quả để tải!', 'warning');
        return;
    }

    const btnDownloadZip = elements.btnDownloadZip;
    if (!btnDownloadZip) return;

    const originalBtnHtml = btnDownloadZip.innerHTML;
    btnDownloadZip.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang nén ZIP...';
    btnDownloadZip.disabled = true;

    // JSZip is loaded globally via CDN in index.html
    const JSZipLib = window.JSZip;
    if (!JSZipLib) {
        showToast('Không tìm thấy thư viện JSZip. Vui lòng tải lại trang!', 'error');
        btnDownloadZip.innerHTML = originalBtnHtml;
        btnDownloadZip.disabled = false;
        return;
    }

    const zip = new JSZipLib();
    state.slicedBlobs.forEach(item => {
        zip.file(item.name, item.blob);
    });

    zip.generateAsync({ type: 'blob' }).then(content => {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'social_sliced_images.zip';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        btnDownloadZip.innerHTML = originalBtnHtml;
        btnDownloadZip.disabled = false;
    }).catch(err => {
        console.error('Lỗi khi nén ZIP:', err);
        showToast('Lỗi tạo ZIP. Hãy tải thủ công!', 'error');
        btnDownloadZip.innerHTML = originalBtnHtml;
        btnDownloadZip.disabled = false;
    });
}
