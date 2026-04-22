import { useCallback } from 'react'

// Hook para navegacao por teclado estilo Excel na tabela de cotacao
// Setas movem o foco entre celulas sem alterar valores
export function useKeyboardNav(totalRows, totalCols, onCellFocus) {
  const handleKeyDown = useCallback((e, rowIdx, colIdx) => {
    let nextRow = rowIdx
    let nextCol = colIdx

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        nextRow = Math.max(0, rowIdx - 1)
        break
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault()
        nextRow = Math.min(totalRows - 1, rowIdx + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (colIdx > 0) {
          nextCol = colIdx - 1
        } else if (rowIdx > 0) {
          nextRow = rowIdx - 1
          nextCol = totalCols - 1
        }
        break
      case 'ArrowRight':
      case 'Tab':
        e.preventDefault()
        if (colIdx < totalCols - 1) {
          nextCol = colIdx + 1
        } else if (rowIdx < totalRows - 1) {
          nextRow = rowIdx + 1
          nextCol = 0
        }
        break
      case 'Escape':
        e.target.blur()
        return
      default:
        return
    }

    onCellFocus(nextRow, nextCol)
  }, [totalRows, totalCols, onCellFocus])

  return { handleKeyDown }
}
