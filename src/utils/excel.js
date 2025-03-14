import * as XLSX from 'xlsx';

const jsonToSpreadsheet = (data, planName, totalWeeks) => {

  const wb = XLSX.utils.book_new();

  for (let week = 1; week <= totalWeeks; week++) {
    const ws = XLSX.utils.aoa_to_sheet([]);

    let rowIndex = 0;

    // App Name Header (Style: Deep Sky Blue)
    const appName = 'NEED-FIT';
    const headerStyle = {
      font: { bold: true, sz: 24, color: { rgb: "FFFFFF" } }, // White text
      fill: { patternType: 'solid', fgColor: { rgb: "00BFFF" } }, // Deep Sky Blue
      alignment: { horizontal: 'center' } // Center the text
    };

    // Add app name header and style
    XLSX.utils.sheet_add_aoa(ws, [[appName]], { origin: `A${rowIndex + 1}` });
    ws['A1'].s = headerStyle;  // Apply the style to A1

    // Merge cells for full header
    ws['!merges'] = [{ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 12 } }]; // Updated merge range // Assuming max 13 columns
    rowIndex += 3;

    data.forEach((dayData, dayIndex) => {
      const { Day, targetMuscle, Workout } = dayData;

      // Add Target Muscle Header, red background
      const targetMuscleHeaderStyle = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },// White text
        fill: { patternType: 'solid', fgColor: { rgb: "FF0000" } } // red background
      };

      XLSX.utils.sheet_add_aoa(ws, [[`Target Muscle: ${targetMuscle}`]], { origin: `A${rowIndex + 1}` });
      ws[`A${rowIndex + 1}`].s = targetMuscleHeaderStyle;

      rowIndex += 2;

      // Dynamic Header creation
      const maxSets = Workout.reduce((max, exercise) => Math.max(max, exercise.Sets), 0);


    //Modified header to match image

           const headerRow1 = ['EXERCISE'];
           const headerRow2 = [''];

           for (let i = 1; i <= maxSets; i++) {
            headerRow1.push(`SET ${i}`, '', '', '');
             headerRow2.push('REPS', 'WEIGHT', 'TIME TAKEN', 'REST TIME');
           }


      // Styling for header all rows, light gray background and black text
      const headerStyleAllRows = {
        font: { bold: true, sz: 12, color: { rgb: "000000" } },// black text
        fill: { patternType: 'solid', fgColor: { rgb: "FFA500" } },// Orange background
        alignment: { horizontal: 'center' } // Center the text

      };

        XLSX.utils.sheet_add_aoa(ws, [headerRow1, headerRow2], { origin: `A${rowIndex + 1}` });
            //Add style to all headers
              const rangeHeaderCell = XLSX.utils.decode_range(`A${rowIndex + 1}:${String.fromCharCode(65 + (headerRow1.length - 1))}${rowIndex+2}`);
                 for(let R = rangeHeaderCell.s.r; R <= rangeHeaderCell.e.r; ++R) {
                   for(let C = rangeHeaderCell.s.c; C <= rangeHeaderCell.e.c; ++C) {
                      const cellAddress  = XLSX.utils.encode_cell({r:R, c:C})
                      if(!ws[cellAddress]){
                         ws[cellAddress] = {};
                      }
                       ws[cellAddress].s =  headerStyleAllRows
                   }
                 }



      rowIndex += 2;

      // Data Rows
      Workout.forEach(exercise => {
        const exerciseRow = [`\t${exercise.name}`];

        for (let i = 1; i <= maxSets; i++) {
          if (i <= exercise.Sets) {
            exerciseRow.push('', '', '', ''); // Add data
          } else {
            exerciseRow.push('', '', '', ''); // Empty Set
          }
        }

        XLSX.utils.sheet_add_aoa(ws, [exerciseRow], { origin: `A${rowIndex + 1}` });
        rowIndex++;


      });
    const separator = Array(headerRow1.length).fill(''); // create array of empty
            XLSX.utils.sheet_add_aoa(ws, [separator], { origin: `A${rowIndex + 1}` });// add empty row for separator

        rowIndex += 2;  // Add a space after each day's workout
    });

    // Calculate column widths (after all data is added)
    const maxSetsOverall = data.reduce((maxSetsOverall, dayData) => {
      const maxSetsForDay = dayData.Workout.reduce((max, exercise) => Math.max(max, exercise.Sets), 0);
      return Math.max(maxSetsOverall, maxSetsForDay);
    }, 0);


    const wsCols = [{ wch: 30 }]; // Width of Exercise Column
    for (let i = 1; i <= maxSetsOverall; i++) {
      wsCols.push({ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 });
    }
    ws['!cols'] = wsCols;
    //Increase cell height
    ws['!rows'] = Array(rowIndex).fill({ hpt: 25 }); // Set row height to 25pt

    XLSX.utils.book_append_sheet(wb, ws, `Week ${week}`);
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${planName ? planName : 'workout_plan'}.xlsx`;  // Use planName, default if not provided
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default jsonToSpreadsheet;