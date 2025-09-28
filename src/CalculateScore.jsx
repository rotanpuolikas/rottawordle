import { useEffect } from "react"
import { useState } from "react"

function CalculateScore({ endscreen }){
  return(
    <div>
      {endscreen.map((innerArray, outerIndex) => (
        <ul key={outerIndex}>
        {innerArray.map((item, innerIndex) => (
          <li key={innerIndex}>{item}</li>
        ))}
        </ul>
      ))}
    </div>
  )
}

export default CalculateScore
