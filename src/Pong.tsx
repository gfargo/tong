import { Box, Text, useApp, useInput } from 'ink';
import React, { useEffect, useState } from 'react';
import {
	BALL_CHAR,
	PADDLE_HEIGHT,
	GAME_WIDTH,
	GAME_HEIGHT,
	GAME_SPEED,
	INITIAL_BALL_SPEED,
	MAX_BALL_SPEED,
	BALL_SPEED_INCREMENT,
	WINNING_SCORE,
	LEFT_PADDLE_X,
	RIGHT_PADDLE_X,
	INITIAL_BALL_POSITION
} from './constants.js';

export const Pong = ({
	multiplayer,
}: {
	multiplayer: boolean;
}): JSX.Element | null => {
	if (multiplayer) {
		console.log('Two player mode is not implemented yet');
	}

	const {exit} = useApp();
	const [leftScore, setLeftScore] = useState(0);
	const [rightScore, setRightScore] = useState(0);
	const [leftPaddle, setLeftPaddle] = useState(0);
	const [rightPaddle, setRightPaddle] = useState(0);
	const [ballX, setBallX] = useState(INITIAL_BALL_POSITION.x);
	const [ballY, setBallY] = useState(INITIAL_BALL_POSITION.y);
	const [ballDx, setBallDx] = useState(1);
	const [ballDy, setBallDy] = useState(1);
	const [gameOver, setGameOver] = useState(false);
	const [winner, setWinner] = useState('');
	const [ballSpeed, setBallSpeed] = useState(INITIAL_BALL_SPEED);
	const [gameState, setGameState] = useState('menu');

	useInput(
		(
			_input: string,
			key: {upArrow: boolean; downArrow: boolean; escape: boolean; return: boolean},
		) => {
			if (gameState === 'menu') {
				if (key.return) {
					setGameState('playing');
				}
			} else if (gameState === 'playing') {
				if (key.upArrow) {
					setLeftPaddle(prev => Math.max(0, prev - 1));
				} else if (key.downArrow) {
					setLeftPaddle(prev => Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + 1));
				} else if (key.escape) {
					setGameState('menu');
					resetGame();
				}
			} else if (gameState === 'gameOver') {
				if (key.return) {
					setGameState('menu');
					resetGame();
				} else if (key.escape) {
					exit();
				}
			}
		},
	);

	const resetGame = () => {
		setLeftScore(0);
		setRightScore(0);
		setLeftPaddle(0);
		setRightPaddle(0);
		setBallX(INITIAL_BALL_POSITION.x);
		setBallY(INITIAL_BALL_POSITION.y);
		setBallDx(1);
		setBallDy(1);
		setGameOver(false);
		setWinner('');
		setBallSpeed(INITIAL_BALL_SPEED);
	};

	useEffect(() => {
		if (gameState !== 'playing') return;

		const timer = setInterval(() => {
			setBallX(prevX => {
				const newX = prevX + ballDx * ballSpeed;
				if (newX <= LEFT_PADDLE_X + 1 && ballY >= leftPaddle && ballY < leftPaddle + PADDLE_HEIGHT) {
					setBallDx(prev => -prev);
					return LEFT_PADDLE_X + 2;
				}
				if (newX >= RIGHT_PADDLE_X - 1 && ballY >= rightPaddle && ballY < rightPaddle + PADDLE_HEIGHT) {
					setBallDx(prev => -prev);
					return RIGHT_PADDLE_X - 2;
				}
				return newX;
			});

			setBallY(prevY => {
				const newY = prevY + ballDy * ballSpeed;
				if (newY <= 0 || newY >= GAME_HEIGHT - 1) {
					setBallDy(prev => -prev);
					return newY <= 0 ? 1 : GAME_HEIGHT - 2;
				}
				return newY;
			});

			// Simple AI for right paddle
			setRightPaddle(prev => {
				if (ballY > prev + PADDLE_HEIGHT / 2) {
					return Math.min(GAME_HEIGHT - PADDLE_HEIGHT, prev + 1);
				} else if (ballY < prev + PADDLE_HEIGHT / 2) {
					return Math.max(0, prev - 1);
				}
				return prev;
			});

			// Increase ball speed on paddle hit
			if (
				(ballX <= LEFT_PADDLE_X + 2 && ballY >= leftPaddle && ballY < leftPaddle + PADDLE_HEIGHT) ||
				(ballX >= RIGHT_PADDLE_X - 2 && ballY >= rightPaddle && ballY < rightPaddle + PADDLE_HEIGHT)
			) {
				setBallSpeed(prev => Math.min(prev + BALL_SPEED_INCREMENT, MAX_BALL_SPEED));
			}

			// Reset ball if it goes out of bounds
			if (ballX < 0) {
				setBallX(INITIAL_BALL_POSITION.x);
				setBallY(INITIAL_BALL_POSITION.y);
				setBallSpeed(INITIAL_BALL_SPEED);
				setRightScore(prev => {
					const newScore = prev + 1;
					if (newScore >= WINNING_SCORE) {
						setGameOver(true);
						setWinner('Right');
						setGameState('gameOver');
					}
					return newScore;
				});
			} else if (ballX > GAME_WIDTH - 1) {
				setBallX(INITIAL_BALL_POSITION.x);
				setBallY(INITIAL_BALL_POSITION.y);
				setBallSpeed(INITIAL_BALL_SPEED);
				setLeftScore(prev => {
					const newScore = prev + 1;
					if (newScore >= WINNING_SCORE) {
						setGameOver(true);
						setWinner('Left');
						setGameState('gameOver');
					}
					return newScore;
				});
			}
		}, GAME_SPEED);

		return () => clearInterval(timer);
	}, [ballDx, ballDy, leftPaddle, rightPaddle, gameOver, ballSpeed, gameState]);

	const renderGame = () => (
		<Box flexDirection="column">
			<Box justifyContent="space-between" width={GAME_WIDTH}>
				<Text>Left: {leftScore}</Text>
				<Text>Right: {rightScore}</Text>
				<Text>Ball Speed: {ballSpeed.toFixed(1)}x</Text>
			</Box>
			{Array.from({length: GAME_HEIGHT}).map((_, y) => (
				<Box key={y}>
					{Array.from({length: GAME_WIDTH}).map((_, x) => {
						if (Math.round(ballX) === x && Math.round(ballY) === y) {
							return <Text key={`${x}-${y}`}>{BALL_CHAR}</Text>;
						}
						if (x === LEFT_PADDLE_X && y >= leftPaddle && y < leftPaddle + PADDLE_HEIGHT) {
							return <Text key={`${x}-${y}`}>█</Text>;
						}
						if (
							x === RIGHT_PADDLE_X &&
							y >= rightPaddle &&
							y < rightPaddle + PADDLE_HEIGHT
						) {
							return <Text key={`${x}-${y}`}>█</Text>;
						}
						if (x === GAME_WIDTH / 2) {
							return <Text key={`${x}-${y}`}>|</Text>;
						}
						return <Text key={`${x}-${y}`}> </Text>;
					})}
				</Box>
			))}
		</Box>
	);

	if (gameState === 'menu') {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center">
				<Text>Welcome to Pong!</Text>
				<Text>Use Up and Down arrow keys to move the left paddle</Text>
				<Text>Press Enter to start the game</Text>
				<Text>Press Esc to exit during the game</Text>
			</Box>
		);
	}

	if (gameState === 'gameOver') {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center">
				<Text>{winner} player wins!</Text>
				<Text>Game Over</Text>
				<Text>Press Enter to return to menu</Text>
				<Text>Press Esc to exit</Text>
			</Box>
		);
	}

	return renderGame();
};

