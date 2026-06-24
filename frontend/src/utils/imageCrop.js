export const cropToFocalPoint = (file, fx, fy) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
        const TW = 1200, TH = 900;
        const ar = img.width / img.height, tar = TW / TH;
        let sx, sy, sw, sh;
        if (ar > tar) { sh = img.height; sw = sh * tar; sx = (img.width - sw) * (fx / 100); sy = 0; }
        else          { sw = img.width;  sh = sw / tar; sx = 0; sy = (img.height - sh) * (fy / 100); }
        const c = document.createElement('canvas');
        c.width = TW; c.height = TH;
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, TW, TH);
        c.toBlob(blob => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.92);
        URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
});
