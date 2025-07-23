/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

/**
 * RTL (Right-to-Left) utility functions for Arabic and other RTL languages
 */

export const getRTLStyles = (isRTL: boolean) => ({
  textAlign: isRTL ? 'right' as const : 'left' as const,
  direction: isRTL ? 'rtl' as const : 'ltr' as const,
});

export const getMarginDirection = (isRTL: boolean, margin: number) => ({
  marginLeft: isRTL ? 0 : margin,
  marginRight: isRTL ? margin : 0,
});

export const getPaddingDirection = (isRTL: boolean, padding: number) => ({
  paddingLeft: isRTL ? 0 : padding,
  paddingRight: isRTL ? padding : 0,
});

export const getFloatDirection = (isRTL: boolean) => ({
  float: isRTL ? 'right' as const : 'left' as const,
});

export const getBorderDirection = (isRTL: boolean, borderWidth: string) => ({
  borderLeft: isRTL ? 'none' : borderWidth,
  borderRight: isRTL ? borderWidth : 'none',
});

export const getTransformDirection = (isRTL: boolean, translateX: string) => ({
  transform: `translateX(${isRTL ? translateX : `-${translateX}`})`,
});

// Utility function to flip numeric values for RTL
export const flipForRTL = (value: number, isRTL: boolean, containerWidth?: number): number => {
  if (!isRTL || !containerWidth) return value;
  return containerWidth - value;
};

// Helper for positioning elements in RTL layouts
export const getPositionStyles = (isRTL: boolean, left?: number, right?: number) => {
  if (isRTL) {
    return {
      left: right !== undefined ? right : undefined,
      right: left !== undefined ? left : undefined,
    };
  }
  return {
    left,
    right,
  };
};

// Energy industry specific RTL considerations
export const getEnergyWidgetStyles = (isRTL: boolean) => ({
  ...getRTLStyles(isRTL),
  // Energy graphs and charts should maintain consistent orientation
  '& .recharts-wrapper': {
    direction: 'ltr', // Charts always LTR for consistency
  },
  // But labels and text should respect RTL
  '& .widget-label': {
    textAlign: isRTL ? 'right' as const : 'left' as const,
  },
});