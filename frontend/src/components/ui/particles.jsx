"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return mousePosition;
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const hexInt = parseInt(hex, 16);
  return [(hexInt >> 16) & 255, (hexInt >> 8) & 255, hexInt & 255];
}

export function Particles({
  className = "",
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color = "#ffffff",
  vx = 0,
  vy = 0,
}) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const contextRef = useRef(null);
  const circlesRef = useRef([]);
  const mousePosition = useMousePosition();
  const mouseRef = useRef({ x: 0, y: 0 });
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  const propsRef = useRef({ quantity, staticity, ease, size, vx, vy, color });
  propsRef.current = { quantity, staticity, ease, size, vx, vy, color };

  const rgbRef = useRef(hexToRgb(color));
  rgbRef.current = hexToRgb(color);

  const remapValue = (value, start1, end1, start2, end2) => {
    const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const circleParams = useCallback(() => {
    const { w, h } = canvasSizeRef.current;
    const { size: sz } = propsRef.current;
    const x = Math.floor(Math.random() * Math.max(w, 1));
    const y = Math.floor(Math.random() * Math.max(h, 1));
    const pSize = Math.floor(Math.random() * 2) + sz;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    return {
      x,
      y,
      translateX: 0,
      translateY: 0,
      size: pSize,
      alpha: 0,
      targetAlpha,
      dx: (Math.random() - 0.5) * 0.1,
      dy: (Math.random() - 0.5) * 0.1,
      magnetism: 0.1 + Math.random() * 4,
    };
  }, []);

  const drawCircle = useCallback((circle, update = false) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    const { x, y, translateX, translateY, size: cs, alpha } = circle;
    const rgb = rgbRef.current;
    ctx.translate(translateX, translateY);
    ctx.beginPath();
    ctx.arc(x, y, cs, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${rgb.join(", ")}, ${alpha})`;
    ctx.fill();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!update) {
      circlesRef.current.push(circle);
    }
  }, [dpr]);

  const clearContext = useCallback(() => {
    const ctx = contextRef.current;
    const { w, h } = canvasSizeRef.current;
    if (ctx) ctx.clearRect(0, 0, w, h);
  }, []);

  const drawParticles = useCallback(() => {
    clearContext();
    const { quantity: q } = propsRef.current;
    circlesRef.current = [];
    for (let i = 0; i < q; i++) {
      drawCircle(circleParams(), false);
    }
  }, [circleParams, clearContext, drawCircle]);

  const resizeCanvas = useCallback(() => {
    const container = canvasContainerRef.current;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!container || !canvas || !ctx) return;
    circlesRef.current = [];
    canvasSizeRef.current.w = container.offsetWidth;
    canvasSizeRef.current.h = container.offsetHeight;
    const { w, h } = canvasSizeRef.current;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }, [dpr]);

  const initCanvas = useCallback(() => {
    resizeCanvas();
    drawParticles();
  }, [drawParticles, resizeCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    contextRef.current = canvas.getContext("2d");
    runningRef.current = true;

    const animate = () => {
      if (!runningRef.current || !contextRef.current) return;
      const { staticity, ease, vx, vy } = propsRef.current;
      const { w, h } = canvasSizeRef.current;
      clearContext();

      const list = circlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const circle = list[i];
        const edge = [
          circle.x + circle.translateX - circle.size,
          w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }
        circle.x += circle.dx + vx;
        circle.y += circle.dy + vy;
        circle.translateX +=
          (mouseRef.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY +=
          (mouseRef.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        drawCircle(circle, true);

        if (
          circle.x < -circle.size ||
          circle.x > w + circle.size ||
          circle.y < -circle.size ||
          circle.y > h + circle.size
        ) {
          list.splice(i, 1);
          drawCircle(circleParams(), false);
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    initCanvas();
    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener("resize", initCanvas);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", initCanvas);
    };
  }, [color, refresh, circleParams, clearContext, drawCircle, initCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { w, h } = canvasSizeRef.current;
    const x = mousePosition.x - rect.left - w / 2;
    const y = mousePosition.y - rect.top - h / 2;
    const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
    if (inside) {
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    }
  }, [mousePosition.x, mousePosition.y]);

  return (
    <div className={cn("pointer-events-none", className)} ref={canvasContainerRef} aria-hidden="true">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
