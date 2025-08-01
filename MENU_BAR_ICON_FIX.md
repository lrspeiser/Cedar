# macOS Menu Bar Icon Fix

## Problem
The Cedar app icon appeared 20% larger than other icons in the macOS menu bar.

## Root Cause
The app was using 32×32 px icons instead of the macOS menu bar standard of 20×20 px.

## Solution
Created proper 20×20 px icons following macOS menu bar specifications:

### Icon Specifications
- **Size**: 20×20 px (standard for menu bar icons on Retina screens)
- **@2x Version**: 40×40 px (for Retina displays, macOS scales 2x)
- **Background**: Transparent
- **Design**: Monochrome with 1-2px margin inside edges
- **Style**: Sharp 1px lines, no shadows or gradients

### Files Created
- `src-tauri/icons/20x20.png` - Base menu bar icon
- `src-tauri/icons/20x20@2x.png` - Retina display version

### Configuration Updated
- Added new icons to `tauri.conf.json` bundle configuration
- Added `macOSPrivateApi: true` for better macOS integration

## Technical Details

### Icon Design
The new icons feature a minimalist brain design that:
- Represents AI/Research (fitting for Cedar)
- Works well at small sizes
- Follows macOS menu bar conventions
- Uses sharp, pixel-perfect lines

### File Sizes
- `20x20.png`: 157 bytes (optimized)
- `20x20@2x.png`: 245 bytes (optimized)

### Color Scheme
- Main color: Dark gray (60, 60, 60)
- Detail lines: Darker gray (40, 40, 40)
- Background: Transparent

## Testing
To verify the fix:
1. Rebuild the application
2. Check that the menu bar icon is now properly sized
3. Verify it matches other menu bar icons in height

## Future Considerations
- The icons are designed to work well in both light and dark mode
- The transparent background ensures compatibility with different menu bar styles
- The monochrome design follows macOS design guidelines 