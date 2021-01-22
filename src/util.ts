export function loadImage(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = src;

    img.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d");

      if (context === null) {
        return reject(new Error("Unable to create rendering context"));
      }

      context.drawImage(img, 0, 0);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    };
  });
}
