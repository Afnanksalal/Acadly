"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface ImageGalleryProps {
  images: string[]
  title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef<HTMLDivElement>(null)

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1)
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return newZoom
    })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [zoomLevel, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // Limit panning based on zoom level
      const maxPan = (zoomLevel - 1) * 200
      setPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY))
      })
    }
  }, [isDragging, zoomLevel, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isFullscreen) {
      e.preventDefault()
      if (e.deltaY < 0) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    }
  }, [isFullscreen, handleZoomIn, handleZoomOut])

  if (images.length === 0) {
    return (
      <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center rounded-xl">
        <span className="text-6xl opacity-30">📷</span>
      </div>
    )
  }

  const goToPrevious = () => {
    resetZoom()
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    resetZoom()
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const openFullscreen = () => {
    setIsFullscreen(true)
    resetZoom()
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
    resetZoom()
  }

  return (
    <>
      {/* Main Image */}
      <div className="relative group">
        <div className="aspect-video w-full bg-muted relative rounded-xl overflow-hidden border border-border">
          <Image
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
          />
          
          {/* Fullscreen button */}
          <button
            onClick={openFullscreen}
            className="absolute top-3 right-3 p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            aria-label="View fullscreen"
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 hover:bg-black/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 rounded-full text-white text-sm font-medium backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                  i === currentIndex
                    ? "border-primary ring-2 ring-primary/30 scale-105"
                    : "border-border hover:border-primary/50 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal with Zoom */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Top toolbar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm">
                {currentIndex + 1} / {images.length}
              </span>
              {zoomLevel > 1 && (
                <span className="text-white/60 text-sm ml-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={resetZoom}
                disabled={zoomLevel === 1}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Reset zoom"
              >
                <RotateCw className="h-5 w-5" />
              </button>
              
              <div className="w-px h-6 bg-white/20 mx-2" />
              
              <button
                onClick={closeFullscreen}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close fullscreen"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Main image area */}
          <div 
            ref={imageContainerRef}
            className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onClick={(e) => {
              if (e.target === e.currentTarget && zoomLevel === 1) {
                closeFullscreen()
              }
            }}
          >
            <div 
              className="relative w-full h-full max-w-6xl max-h-[85vh] m-4 transition-transform duration-100"
              style={{
                transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              }}
            >
              <Image
                src={images[currentIndex]}
                alt={`${title} - Image ${currentIndex + 1}`}
                fill
                className="object-contain select-none"
                sizes="100vw"
                priority
                draggable={false}
              />
            </div>
          </div>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Bottom thumbnails */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      resetZoom()
                      setCurrentIndex(i)
                    }}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                      i === currentIndex 
                        ? "border-white ring-2 ring-white/30" 
                        : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom hint */}
          {zoomLevel === 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none">
              Scroll to zoom • Drag to pan when zoomed
            </div>
          )}
        </div>
      )}
    </>
  )
}
