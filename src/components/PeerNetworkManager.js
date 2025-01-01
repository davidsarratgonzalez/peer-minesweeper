import React, { useState, useEffect } from 'react';
import usePeerNetwork from '../hooks/usePeerNetwork';
import ChatRoom from './ChatRoom';
import './PeerNetworkManager.css';
import UserSetup from './UserSetup';
import GameConfig from './GameConfig';
import Minesweeper from './Minesweeper';
import { createBoard } from '../utils/minesweeperLogic';

/**
 * Component for managing peer network connections and chat
 */
const PeerNetworkManager = () => {
    const [targetPeerId, setTargetPeerId] = useState('');
    const { 
        peerId, 
        isReady, 
        userInfo,
        connectedPeers,
        connectedUsers,
        connectToPeer,
        messages,
        sendMessage,
        disconnectFromNetwork,
        initializeWithUser,
        gameConfig,
        updateGameConfig,
        gameState,
        startGame,
        updateGameState,
        endGame
    } = usePeerNetwork();
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [connectionError, setConnectionError] = useState('');

    useEffect(() => {
        // Remove this effect since we want to allow solo play
        // if (gameState && connectedPeers.length === 0) {
        //     endGame('All players disconnected');
        // }
    }, [connectedPeers.length, gameState, endGame]);

    if (!userInfo) {
        return <UserSetup onComplete={initializeWithUser} />;
    }

    const handleConnect = async (e) => {
        e.preventDefault();
        if (targetPeerId.trim()) {
            try {
                await connectToPeer(targetPeerId.trim());
                setTargetPeerId('');
                setConnectionError('');
            } catch (error) {
                setConnectionError('Failed to connect to peer');
                setTimeout(() => setConnectionError(''), 3000);
            }
        }
    };

    const handleDisconnect = () => {
        // Don't end game on disconnect
        // if (gameState) {
        //     endGame('Player disconnected');
        // }
        disconnectFromNetwork();
    };

    const handleCopyPeerId = () => {
        navigator.clipboard.writeText(peerId);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    const getUserName = (peerId) => {
        const user = connectedUsers.get(peerId);
        return user ? user.name : `Unknown (${peerId})`;
    };

    const handleStartGame = (config) => {
        const initialBoard = createBoard(config.width, config.height, config.bombs);
        startGame(config, initialBoard);
    };

    const handleConfigChange = (newConfig) => {
        updateGameConfig(newConfig);
    };

    const handleGameUpdate = (newBoard) => {
        if (!gameState) return;
        
        updateGameState({
            ...gameState,
            board: newBoard,
            lastUpdate: Date.now()
        });
    };

    const handleGameOver = () => {
        endGame();
    };

    return (
        <div className="peer-network-manager">
            <div className="network-info">
                <div className="peer-id-container">
                    <div className="peer-id-wrapper">
                        <div className="peer-id">{peerId || 'Initializing...'}</div>
                    </div>
                    <button 
                        className={`copy-button ${copyFeedback ? 'copied' : ''}`}
                        onClick={handleCopyPeerId}
                        title="Copy Peer ID"
                    >
                        <i className={`fa-regular ${copyFeedback ? 'fa-circle-check' : 'fa-copy'}`}></i>
                    </button>
                </div>

                <div className="connection-controls">
                    {connectedPeers.length === 0 ? (
                        <form className="connect-form" onSubmit={handleConnect}>
                            <input
                                type="text"
                                value={targetPeerId}
                                onChange={(e) => setTargetPeerId(e.target.value)}
                                placeholder="Enter peer ID"
                                disabled={!isReady}
                            />
                            <button type="submit" disabled={!isReady}>
                                Connect
                            </button>
                            {connectionError && (
                                <div className="connection-error">
                                    {connectionError}
                                </div>
                            )}
                        </form>
                    ) : (
                        <button 
                            className="disconnect-button"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </button>
                    )}
                </div>

                <div className="peers-list">
                    <h3>Players ({connectedPeers.length + 1})</h3>
                    <ul>
                        <li 
                            className="current-user"
                            style={{ color: userInfo.color.value }}
                        >
                            {userInfo.name} (You)
                        </li>
                        {connectedPeers.map((peer) => (
                            <li 
                                key={peer}
                                style={{ color: connectedUsers.get(peer)?.color.value }}
                            >
                                {getUserName(peer)}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="game-container">
                {gameState ? (
                    <Minesweeper 
                        config={gameState.config}
                        board={gameState.board}
                        onGameUpdate={handleGameUpdate}
                        onGameOver={handleGameOver}
                    />
                ) : (
                    <GameConfig 
                        onStartGame={handleStartGame}
                        onConfigChange={handleConfigChange}
                        initialConfig={gameConfig}
                    />
                )}
            </div>

            <div className="chat-container">
                <ChatRoom 
                    messages={messages} 
                    sendMessage={sendMessage}
                    connectedUsers={connectedUsers}
                    currentUser={userInfo}
                />
            </div>
        </div>
    );
};

export default PeerNetworkManager; 