import React, { useState, useEffect } from "react";
import "./styles.css";
import GlobalKeyListener from "./GlobalKeyListener";
import CalculateScore from "./CalculateScore";

// === CHANGE THE SECRET WORD HERE ===
// Must be the same length as WORD_LENGTH below (default 5). Upper/lowercase doesn't matter.
const SECRET = "FACTORY";
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
  const [showPopup, setShowPopup] = useState(false);
  const [showWon, setShowWon] = useState(true);
  const [endscreen, setendscreen] = useState([]);
  const [lost, setLost] = useState(false);
  const [wantCookie, setWantCookie] = useState(false);

  useEffect(() => {
    const seenPopup = localStorage.getItem("seenPopup");
    if (!seenPopup) {
      setShowPopup(true);
      console.log("nähty");
    }
  }, []);

  const dismissPopup = () => {
    localStorage.setItem("seenPopup", true);
    setShowPopup(false);
  };

  const dismissPopupNoCookie = () => {
    setShowPopup(false);
  };

  const dismissWin = () => {
    setShowWon(false);
  };

  function sanitizeInput(value) {
    return value.replace(/[^ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ]/g, "");
  }

  function safeSetCurrent(value) {
    if (value.length > WORD_LENGTH) {
      return null;
    }
    const valtwo = value.toUpperCase();
    setCurrent(sanitizeInput(valtwo));
  }

  function mayhem(newGuesses) {
    const absent = "⬛";
    const present = "🟨";
    const correct = "🟩";
    const statusToEmoji = {
      absent,
      present,
      correct,
    };

    return newGuesses
      .map((item) => item.status.map((s) => statusToEmoji[s]).join(""))
      .join("\n");
  }

  function getKeyStatus(key, guesses) {
    // priority: correct > present > absent
    let status = "";
    for (let guess of guesses) {
      guess.word.split("").forEach((ch, i) => {
        if (ch === key) {
          const s = guess.status[i];
          if (s === "correct")
            status = "correct"; // highest priority
          else if (s === "present" && status !== "correct") status = "present";
          else if (s === "absent" && status === "") status = "absent";
        }
      });
    }
    return status;
  }

  function handleBackClick() {
    safeSetCurrent(current.slice(0, -1));
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
      setendscreen(mayhem(newGuesses));
      console.log(mayhem(guesses));
      setWon(true);
      setMessage("voitit pelin");
      return;
    }

    if (newGuesses.length >= MAX_GUESSES) {
      setendscreen(mayhem(newGuesses));
      setLost(true);
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

        <footer className="footer">
          aitoa rottatechiä vuodesta 2025 |{" "}
          <a href="https://rottaradio.fi/privacy.html">privacy policy</a>
        </footer>
        {won | lost && showWon ? (
          <div className="popup-overlay">
            <div className="winpopup">
              {won ? <p>voitit pelin</p> : <p>hävisit. sana oli {SECRET}</p>}
              <p>tossa kopioitava muoto</p>
              <CalculateScore endscreen={endscreen} />
              <button onClick={dismissWin}>OK</button>
            </div>
          </div>
        ) : (
          <br />
        )}

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <p>We do not collect any data.</p>
              <p>Press OK to add a cookie to never show this popup again.</p>
              <p>Press DISMISS to not add the cookie.</p>
              <button onClick={dismissPopup}>OK</button>
              <button onClick={dismissPopupNoCookie}>DISMISS</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
