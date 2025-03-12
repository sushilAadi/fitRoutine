import OffCanvasComp from '@/components/OffCanvas/OffCanvasComp'
import React from 'react'
import ExerciseDeatil from './ExerciseDeatil'

const ExerciseCanvas = ({show,handleOpenClose,selectedExercise}) => {
  return (
    <OffCanvasComp
            placement="end"
            name="savePlan"
            showProps={show}
            handleClose={handleOpenClose}
            customStyle="pl-4 py-4"
          >
            <ExerciseDeatil handleClose={handleOpenClose} data={selectedExercise} />
          </OffCanvasComp>
  )
}

export default ExerciseCanvas