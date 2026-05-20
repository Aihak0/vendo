import { type DragState } from './Interface'; 

export function colToLetter(c: number): string {
  let letter = "";
  let n = c + 1;
  while (n > 0) {
    n--;
    letter = String.fromCharCode(65 + (n % 26)) + letter;
    n = Math.floor(n / 26);
  }
  return letter;
}

export function getDragState(dragState: DragState, rowNum: number, colNum: number): "drag-start" | "drag-over" | null {
  const { active, startR, startC, curC } = dragState;
  if (!active || startR !== rowNum || startC === null || curC === null) return null;
  const minC = Math.min(startC, curC);
  const maxC = Math.max(startC, curC);
  if (colNum < minC || colNum > maxC) return null;
  return colNum === startC ? "drag-start" : "drag-over";
}
