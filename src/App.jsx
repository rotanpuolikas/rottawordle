import React, { useState } from "react";
import "./styles.css";
import GlobalKeyListener from "./GlobalKeyListener"
import CalculateScore from "./CalculateScore"

// === CHANGE THE SECRET WORD HERE ===
// Must be the same length as WORD_LENGTH below (default 5). Upper/lowercase doesn't matter.
const SECRET = "ALTSU";
const WORD_LENGTH = SECRET.length;
const MAX_GUESSES = 6;

const TOPROW = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Å"];
const MIDROW = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"];
const BOTROW = ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACK"];

function evaluateGuess(guess, secret) {
  // returns an array of statuses: 'correct'(green), 'present'(yellow), 'absent'(gray)
  guess = guess.toUpperCase();
  secret = secret.toUpperCase();
  const result = Array(guess.length).fill("absent");
  const secretChars = secret.split("");

  // first pass: correct letters
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) {
      result[i] = "correct";
      secretChars[i] = null; // consume
    }
  }
  // second pass: present but wrong position
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === "correct") continue;
    const idx = secretChars.indexOf(guess[i]);
    if (idx !== -1) {
      result[i] = "present";
      secretChars[idx] = null; // consume
    }
  }
  return result;
}


export default function App() {
  const [guesses, setGuesses] = useState([]); // array of {word, statusArray}
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");
  const [won, setWon] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [showWon, setShowWon] = useState(true)
  const[endscreen, setendscreen] = useState([])

  const dismissPopup = () => {
    setShowPopup(false);
  };

  const dismissWin = () => {
    setShowWon(false)
  }

  function sanitizeInput(value) {
    return value.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ]/g, "");
  }
  
  function safeSetCurrent(value) {
    if(value.length > WORD_LENGTH){
      return null
    }
    const valtwo = value.toUpperCase();
    setCurrent(sanitizeInput(valtwo));
  }
 function mayhem () {
    const absent = "⬛"
    const present = "🟨"
    const correct = "🟩"

    guesses.map((innerArray) => {
      let tempend = []
      innerArray.status.map((item) => {
        if(item == "correct"){
          tempend.push(correct)
        }
        if(item == "present"){
          tempend.push(present)
        }
        else{
          tempend.push(absent)
        }
      })
      setendscreen([...endscreen, tempend])
      
    })
  } 
 function getKeyStatus(key, guesses) {
  // priority: correct > present > absent
  let status = "";
  for (let guess of guesses) {
    guess.word.split("").forEach((ch, i) => {
      if (ch === key) {
        const s = guess.status[i];
        if (s === "correct") status = "correct"; // highest priority
        else if (s === "present" && status !== "correct") status = "present";
        else if (s === "absent" && status === "") status = "absent";
      }
    });
  }
  return status;
}  
  
  function handleBackClick() {
    safeSetCurrent(current.slice(0, -1))
  }
  const onChange = (e) => {
    const val = e.target.value.toUpperCase();
    // allow only letters and up to WORD_LENGTH
    const cleaned = val
      .replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ]/g, "")
      .slice(0, WORD_LENGTH);
    setCurrent(cleaned);
    setMessage("");
  };

  const submitGuess = () => {
    if (won) return;
    if (current.length !== WORD_LENGTH) {
      setMessage(`Arvauksessa pittää olla ${WORD_LENGTH} kirjainta`);
      return;
    }
    if (guesses.length >= MAX_GUESSES) return;

    const status = evaluateGuess(current, SECRET);
    const newGuess = { word: current, status };
    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);
    setCurrent("");

    if (status.every((s) => s === "correct")) {
      mayhem()
      setWon(true);
      setMessage("voitit pelin");
      return;
    }

    if (newGuesses.length >= MAX_GUESSES) {
      setMessage(`Hävisit, voi harmi. Sana oli: ${SECRET.toUpperCase()}`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submitGuess();
    if (e.key === "Backspace") {
      // default input handles it
    }
  };

  const reset = () => {
    setGuesses([]);
    setCurrent("");
    setMessage("");
    setWon(false);
  };

  return (
    <>
      <div className="container">
        <h1>Eeppinen rottawordle</h1>

        <div className="board">
          {Array.from({ length: MAX_GUESSES }).map((_, rowIdx) => {
            const guess = guesses[rowIdx];
            const isCurrent = rowIdx === guesses.length;

            // If it's a past guess → show it
            // If it's the current guess row → show current input
            // Otherwise → show empty row
            const letters = guess
              ? guess.word.split("")
              : isCurrent
                ? current
                    .split("")
                    .concat(Array(WORD_LENGTH - current.length).fill(""))
                : Array(WORD_LENGTH).fill("");

            const statuses = guess ? guess.status : Array(WORD_LENGTH).fill("");
            return (
              <div key={rowIdx} className="row">
                {letters.map((ch, i) => (
                  <div
                    key={i}
                    className={`tile ${
                      statuses[i]
                        ? statuses[i] // past guess with status
                        : isCurrent && ch
                          ? "typing" // current typing row
                          : ""
                    }`}
                  >
                    {ch}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <GlobalKeyListener
          current={current}
          safeSetCurrent={safeSetCurrent}
          onChange={onChange}
          onKeyDown={onKeyDown}
          WORD_LENGTH={WORD_LENGTH}
        />

        <div className="keyboard">
          <ul>
            {TOPROW.map((value, index) => {
              return (
                <li
                  key={index}
                  className={getKeyStatus(value, guesses)} // apply status class
                  onClick={() => safeSetCurrent(current + value)}
                >
                  {value}
                </li>
              );
            })}
          </ul>

          <ul>
            {MIDROW.map((value, index) => {
              return (
                <li
                  key={index}
                  className={getKeyStatus(value, guesses)}
                  onClick={() => safeSetCurrent(current + value)}
                >
                {value}
                </li>
              );
            })}
          </ul>

          <ul>
            {BOTROW.map((value, index) => {
              if (value === "ENTER") {
                return (
                  <li className="enterkey" key={index} onClick={submitGuess}>
                    {value}
                  </li>
                );
              }
              if (value === "BACK") {
                return (
                  <li className="backkey" key={index} onClick={handleBackClick}>
                    🢤
                  </li>
                );
              }
              return (
                <li
                  key={index}
                  className={getKeyStatus(value, guesses)}
                  onClick={() => safeSetCurrent(current + value)}
                >
                  {value}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="message">{message}</div>

        <footer className="footer">aitoa rottatechiä vuodesta 2025</footer>
        {won && showWon && (
            <div className="winpopup">
              <p>voitit pelin</p>
              <CalculateScore
                endscreen={endscreen}
                />
              <button onClick={dismissWin}>OK</button>
            </div>
        )}
        
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <p>We do not collect any data.</p>
              <button onClick={dismissPopup}>OK</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
