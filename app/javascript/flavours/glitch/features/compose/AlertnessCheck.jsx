import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AlertnessCheck = ({ trackScore }) => {
  const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW', 'PURPLE', 'CYAN'];
  const colorStyles = ['red', 'green', 'blue', 'yellow', 'purple', 'cyan'];

  const [correctColorWord, setCorrectColorWord] = useState('');
  const [correctColorStyle, setCorrectColorStyle] = useState('');
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState(null); // Store the last score
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (gameStarted) {
      const wordIndex = Math.floor(Math.random() * colors.length);
      const styleIndex = wordIndex !== colors.length - 1 ? wordIndex + 1 : 0;  // Ensure different style.
      setCorrectColorWord(colors[wordIndex]);
      setCorrectColorStyle(colorStyles[styleIndex]);
    }
  }, [gameStarted, score]);

  useEffect(() => {
    let intervalId;
    if (gameStarted) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [gameStarted]);

  useEffect(() => {
    if (timeLeft === 0) {
      endGame();
    }
  }, [timeLeft]);

  const endGame = () => {
    setGameStarted(false);
    setLastScore(score); // Update the last score when game ends
    if (trackScore) {
      trackScore(score);
    }
    setFeedback(`Game over! Your score: ${score}`);
  };

  const handleChoice = (selectedColor) => {
    if (!gameStarted) return;

    const isCorrect = selectedColor === correctColorWord;
    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      setFeedback('Correct!');
    } else {
      setFeedback('Incorrect');
    }

    setTimeout(() => {
      setFeedback('');
    }, 1500); // Clear feedback after 1.5 seconds
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameStarted(true); 
  };

  return (
    <div style={{
      width: '296px', 
      height: '296px', 
      padding: '8px', 
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      background: '#fff',
      border: '2px solid #000',
      borderRadius: '10px',
      margin: 'auto'
    }}>
      {!gameStarted && (
        <>
          <button onClick={startGame} style={{
            fontSize: '1em',
            padding: '5px 10px',
            margin: '10px 0',
          }}>
            Start Game
          </button>
          {lastScore !== null && <div style={{ fontSize: '16px' }}>Last score: {lastScore}</div>}
        </>
      )}
      {gameStarted && (
        <>
          <div style={{ textAlign: 'center', color: correctColorStyle, fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
            {correctColorWord}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', flexGrow: 1 }}>
            {colors.map(color => (
              <button key={color} onClick={() => handleChoice(color)} style={{
                backgroundColor: color.toLowerCase(),
                color: '#fff',
                margin: '5px',
                padding: '8px 8px',
                border: 'none',
                borderRadius: '5px',
              }}>
                {color}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '16px', textAlign: 'center' }}>
            {feedback && <div style={{ color: feedback === 'Correct!' ? 'green' : 'red' }}>{feedback}</div>}
            <div>Score: {score}</div>
            <div>Time Left: {timeLeft}s</div>
          </div>
        </>
      )}
    </div>
  );
};

AlertnessCheck.propTypes = {
  trackScore: PropTypes.func,
};

export default AlertnessCheck;