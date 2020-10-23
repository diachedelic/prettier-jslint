room = room.map((row, rowIndex) => (
  row.map((col, colIndex) => (
    (rowIndex === 0 || colIndex === 0 || rowIndex === height || colIndex === width) ? 1 : 0
  ))
))
