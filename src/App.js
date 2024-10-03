import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';

// Predefined font options
const FONT_FAMILIES = [
  'Arial',
  'Courier New',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
  'Lucida Console',
];

function App() {
  // State Variables
  const [imageSrc, setImageSrc] = useState(null);
  const [image, setImage] = useState(null);
  const [watermarkText, setWatermarkText] = useState('Sample Watermark');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textAlign, setTextAlign] = useState('center');
  const [rotation, setRotation] = useState(0);
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shadowBlur, setShadowBlur] = useState(0);
  const [shadowOffsetX, setShadowOffsetX] = useState(0);
  const [shadowOffsetY, setShadowOffsetY] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  const [fontColor, setFontColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropEnd, setCropEnd] = useState(null);
  const [isCropMode, setIsCropMode] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 50, y: 50 });

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          setImage(img);
          setImageSrc(reader.result);
          setPosition({ x: 50, y: 50 });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert Hex to RGB
  const hexToRgb = (hex) => {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('');
    }
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };

  // Handle Mouse Down
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isCropMode) {
      setIsCropping(true);
      setCropStart({ x: mouseX, y: mouseY });
      setCropEnd({ x: mouseX, y: mouseY });
    } else {
      setIsDragging(true);
      dragStartRef.current = { x: mouseX, y: mouseY };
      positionStartRef.current = { ...position };
    }
  };

  // Handle Mouse Move
  const handleMouseMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      if (isCropping && cropStart) {
        setCropEnd({ x: mouseX, y: mouseY });
      } else if (isDragging) {
        const deltaX = mouseX - dragStartRef.current.x;
        const deltaY = mouseY - dragStartRef.current.y;

        const newX = Math.max(
          0,
          Math.min(
            100,
            positionStartRef.current.x + (deltaX / canvas.width) * 100
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            100,
            positionStartRef.current.y + (deltaY / canvas.height) * 100
          )
        );

        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, isCropping, cropStart]
  );

  // Handle Mouse Up
  const handleMouseUp = useCallback(() => {
    if (isCropping) {
      setIsCropping(false);
    }
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isCropping, isDragging]);

  // Draw Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && image) {
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Draw cropping rectangle
      if (isCropping && cropStart && cropEnd) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.setLineDash([6]);
        const x = cropStart.x;
        const y = cropStart.y;
        const width = cropEnd.x - cropStart.x;
        const height = cropEnd.y - cropStart.y;
        ctx.strokeRect(x, y, width, height);
        ctx.setLineDash([]);
      }

      // Draw watermark if not in cropping mode
      if (!isCropMode) {
        ctx.globalAlpha = opacity;
        ctx.font = `${fontWeight} ${fontStyle} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'top';
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;

        const lines = watermarkText.split('\n');
        const lineHeightPx = fontSize * lineHeight;
        let maxTextWidth = 0;

        lines.forEach((line) => {
          const metrics = ctx.measureText(line);
          if (metrics.width > maxTextWidth) {
            maxTextWidth = metrics.width;
          }
        });

        const textHeight = lineHeightPx * lines.length;
        const xPos = (position.x / 100) * canvas.width;
        const yPos = (position.y / 100) * canvas.height;

        ctx.save();
        ctx.translate(xPos, yPos);
        ctx.rotate((rotation * Math.PI) / 180);

        let xOffset = 0;
        if (textAlign === 'center') {
          xOffset = -maxTextWidth / 2;
        } else if (textAlign === 'right') {
          xOffset = -maxTextWidth;
        }

        if (backgroundOpacity > 0) {
          ctx.fillStyle = `rgba(${hexToRgb(
            backgroundColor
          )}, ${backgroundOpacity})`;
          ctx.fillRect(xOffset - 5, -5, maxTextWidth + 10, textHeight + 10);
        }

        ctx.fillStyle = fontColor;

        lines.forEach((line, index) => {
          ctx.fillText(line, xOffset, index * lineHeightPx);
        });

        ctx.restore();
      }
    }
  }, [
    image,
    watermarkText,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    fontColor,
    opacity,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    backgroundColor,
    backgroundOpacity,
    textAlign,
    rotation,
    position,
    lineHeight,
    isCropping,
    cropStart,
    cropEnd,
    isCropMode,
  ]);

  // Event listeners for dragging and cropping
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging || isCropping) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging || isCropping) {
        handleMouseUp();
      }
    };

    if (isDragging || isCropping) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isCropping, handleMouseMove, handleMouseUp]);

  // Update canvas whenever dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Perform the crop operation
  const handleCrop = () => {
    if (cropStart && cropEnd) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const width = Math.abs(cropEnd.x - cropStart.x);
      const height = Math.abs(cropEnd.y - cropStart.y);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');

      tempCtx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height
      );

      const croppedImage = new Image();
      croppedImage.onload = () => {
        setImage(croppedImage);
        setCropStart(null);
        setCropEnd(null);
        setIsCropMode(false);
      };
      croppedImage.src = tempCanvas.toDataURL();
    }
  };

  // Download the canvas as an image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'watermarked-image.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8 text-indigo-800">Kathy's Watermark Tool</h1>

      <div className="w-full max-w-6xl bg-white p-8 rounded-lg shadow-lg">
        {/* Image Upload Section */}
        <div className="mb-8">
          <label
            className="block text-indigo-700 text-lg font-semibold mb-3"
            htmlFor="imageUpload"
          >
            Upload Image
          </label>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="imageUpload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-indigo-300 border-dashed rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <LucideIcons.Image className="w-12 h-12 mb-4 text-indigo-500" />
                <p className="mb-2 text-sm text-indigo-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-indigo-500">PNG, JPG or GIF (MAX. 800x400px)</p>
              </div>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Customization Options */}
        {imageSrc && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Canvas Preview */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden shadow-md">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  cursor: isDragging || isCropping ? 'grabbing' : 'crosshair',
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-8 overflow-auto max-h-[calc(100vh-16rem)]">
              {/* Mode Toggle */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsCropMode(false)}
                  className={`flex-1 py-3 px-4 rounded-full transition duration-300 ${
                    !isCropMode
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Watermark Mode
                </button>
                <button
                  onClick={() => setIsCropMode(true)}
                  className={`flex-1 py-3 px-4 rounded-full transition duration-300 ${
                    isCropMode
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Crop Mode
                </button>
              </div>

              {!isCropMode && (
                <>
                  {/* Watermark Text */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="watermarkText"
                    >
                      Watermark Text
                    </label>
                    <textarea
                      id="watermarkText"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>

                  {/* Font Family */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="fontFamily"
                    >
                      Font Family
                    </label>
                    <select
                      id="fontFamily"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {FONT_FAMILIES.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="fontSize"
                    >
                      Font Size: {fontSize}px
                    </label>
                    <input
                      type="range"
                      id="fontSize"
                      min="10"
                      max="500"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Font Color */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="fontColor"
                    >
                      Font Color
                    </label>
                    <input
                      type="color"
                      id="fontColor"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="w-full h-10 p-0 border-0 rounded-lg"
                    />
                  </div>

                  {/* Font Weight */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="fontWeight"
                    >
                      Font Weight
                    </label>
                    <select
                      id="fontWeight"
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="bolder">Bolder</option>
                      <option value="lighter">Lighter</option>
                    </select>
                  </div>

                  {/* Font Style */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="fontStyle"
                    >
                      Font Style
                    </label>
                    <select
                      id="fontStyle"
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                      <option value="oblique">Oblique</option>
                    </select>
                  </div>

                  {/* Line Height */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="lineHeight"
                    >
                      Line Height: {lineHeight}
                    </label>
                    <input
                      type="range"
                      id="lineHeight"
                      min="1"
                      max="3"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="textAlign"
                    >
                      Text Alignment
                    </label>
                    <select
                      id="textAlign"
                      value={textAlign}
                      onChange={(e) => setTextAlign(e.target.value)}
                      className="w-full px-4 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  {/* Rotation */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="rotation"
                    >
                      Rotation: {rotation}°
                    </label>
                    <input
                      type="range"
                      id="rotation"
                      min="0"
                      max="360"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Opacity */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="opacity"
                    >
                      Opacity: {opacity}
                    </label>
                    <input
                      type="range"
                      id="opacity"
                      min="0"
                      max="1"
                      step="0.01"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Shadow Color */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="shadowColor"
                    >
                      Shadow Color
                    </label>
                    <input
                      type="color"
                      id="shadowColor"
                      value={shadowColor}
                      onChange={(e) => setShadowColor(e.target.value)}
                      className="w-full h-10 p-0 border-0 rounded-lg"
                    />
                  </div>

                  {/* Shadow Blur */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="shadowBlur"
                    >
                      Shadow Blur: {shadowBlur}px
                    </label>
                    <input
                      type="range"
                      id="shadowBlur"
                      min="0"
                      max="20"
                      value={shadowBlur}
                      onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Shadow Offset X */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="shadowOffsetX"
                    >
                      Shadow Offset X: {shadowOffsetX}px
                    </label>
                    <input
                      type="range"
                      id="shadowOffsetX"
                      min="-20"
                      max="20"
                      value={shadowOffsetX}
                      onChange={(e) => setShadowOffsetX(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Shadow Offset Y */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="shadowOffsetY"
                    >
                      Shadow Offset Y: {shadowOffsetY}px
                    </label>
                    <input
                      type="range"
                      id="shadowOffsetY"
                      min="-20"
                      max="20"
                      value={shadowOffsetY}
                      onChange={(e) => setShadowOffsetY(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Background Color */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="backgroundColor"
                    >
                      Background Color
                    </label>
                    <input
                      type="color"
                      id="backgroundColor"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-full h-10 p-0 border-0 rounded-lg"
                    />
                  </div>

                  {/* Background Opacity */}
                  <div>
                    <label
                      className="block text-indigo-700 text-sm font-semibold mb-2"
                      htmlFor="backgroundOpacity"
                    >
                      Background Opacity: {backgroundOpacity}
                    </label>
                    <input
                      type="range"
                      id="backgroundOpacity"
                      min="0"
                      max="1"
                      step="0.01"
                      value={backgroundOpacity}
                      onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Download Button */}
                  <div>
                    <button
                      onClick={handleDownload}
                      className="w-full bg-green-500 text-white py-3 px-4 rounded-full hover:bg-green-600 transition duration-300 flex items-center justify-center space-x-2"
                    >
                      <LucideIcons.ArrowDownCircle className="w-5 h-5" />
                      <span>Download Watermarked Image</span>
                    </button>
                  </div>
                </>
              )}

              {isCropMode && (
                <>
                  {/* Crop Instructions */}
                  <div className="text-indigo-700">
                    <p className="mb-4">
                      Click and drag on the image to select the crop area.
                    </p>
                    <button
                      onClick={handleCrop}
                      disabled={!cropStart || !cropEnd}
                      className={`w-full py-3 px-4 rounded-full transition duration-300 flex items-center justify-center space-x-2 ${
                        cropStart && cropEnd
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <LucideIcons.Crop className="w-5 h-5" />
                      <span>Crop Image</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;