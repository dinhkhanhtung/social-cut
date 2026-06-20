// --- Watermark Rendering Module ---

/**
 * Vẽ watermark chữ hoặc ảnh lên canvas context chỉ định
 * @param {CanvasRenderingContext2D} targetCtx - Context vẽ đích
 * @param {string} position - Vị trí: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
 * @param {number} opacityVal - Độ mờ: 0 - 100
 * @param {Object} config - Cấu hình chi tiết
 */
export function drawWatermarkOnCtx(targetCtx, position, opacityVal, config = {}) {
    const type = config.type || 'text';
    
    targetCtx.save();
    targetCtx.globalAlpha = opacityVal / 100;
    
    if (type === 'text') {
        const text = config.text || '';
        if (!text) {
            targetCtx.restore();
            return;
        }
        const fontSize = config.fontSize || 24;
        targetCtx.font = `bold ${fontSize}px 'Inter', sans-serif`;
        
        const textMetrics = targetCtx.measureText(text);
        const textWidth = textMetrics.width;
        const padding = fontSize * 0.8;
        
        let x = config.cellX;
        let y = config.cellY;
        
        targetCtx.textAlign = 'left';
        targetCtx.textBaseline = 'middle';
        
        if (position === 'bottom-right') {
            x = config.cellX + config.cellW - textWidth - padding;
            y = config.cellY + config.cellH - padding;
        } else if (position === 'bottom-left') {
            x = config.cellX + padding;
            y = config.cellY + config.cellH - padding;
        } else if (position === 'top-right') {
            x = config.cellX + config.cellW - textWidth - padding;
            y = config.cellY + padding + fontSize / 2;
        } else if (position === 'top-left') {
            x = config.cellX + padding;
            y = config.cellY + padding + fontSize / 2;
        } else if (position === 'center') {
            x = config.cellX + (config.cellW - textWidth) / 2;
            y = config.cellY + config.cellH / 2;
        }
        
        targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        targetCtx.lineWidth = Math.max(2, fontSize / 8);
        targetCtx.lineJoin = 'round';
        targetCtx.strokeText(text, x, y);
        
        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        targetCtx.fillText(text, x, y);
        
    } else if (type === 'image') {
        const img = config.imageObj;
        if (!img) {
            targetCtx.restore();
            return;
        }
        
        const scalePercent = config.scalePercent || 20;
        const maxW = config.cellW * (scalePercent / 100);
        const maxH = config.cellH * (scalePercent / 100);
        
        let logoW = img.width;
        let logoH = img.height;
        
        const ratio = Math.min(maxW / logoW, maxH / logoH);
        logoW = logoW * ratio;
        logoH = logoH * ratio;
        
        const padding = Math.max(8, logoW * 0.2);
        
        let x = config.cellX;
        let y = config.cellY;
        
        if (position === 'bottom-right') {
            x = config.cellX + config.cellW - logoW - padding;
            y = config.cellY + config.cellH - logoH - padding;
        } else if (position === 'bottom-left') {
            x = config.cellX + padding;
            y = config.cellY + config.cellH - logoH - padding;
        } else if (position === 'top-right') {
            x = config.cellX + config.cellW - logoW - padding;
            y = config.cellY + padding;
        } else if (position === 'top-left') {
            x = config.cellX + padding;
            y = config.cellY + padding;
        } else if (position === 'center') {
            x = config.cellX + (config.cellW - logoW) / 2;
            y = config.cellY + (config.cellH - logoH) / 2;
        }
        
        targetCtx.drawImage(img, x, y, logoW, logoH);
    }
    
    targetCtx.restore();
}
