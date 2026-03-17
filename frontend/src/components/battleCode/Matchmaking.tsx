import React, { useState, useEffect } from 'react';
import '../../assets/battleCode/makingmatch.css';
import { io, Socket } from 'socket.io-client';

interface MatchmakingProps {
  onMatchFound?: (matchData: any) => void;
  onCancel?: () => void;
  userId?: string;
  username?: string;
  rank?: string;
}

interface Player {
  id: string;
  username: string;
  rank: string;
  avatar?: string;
  ready?: boolean;
}

const Matchmaking: React.FC<MatchmakingProps> = ({
  onMatchFound,
  onCancel,
  userId = 'user123',
  username = 'CodeMaster',
  rank = 'Diamond'
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [queueStatus, setQueueStatus] = useState<'idle' | 'finding' | 'found'>('idle');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [playersFound, setPlayersFound] = useState<Player[]>([{
    id: userId,
    username,
    rank,
    ready: true
  }]);
  const [waitingMessage, setWaitingMessage] = useState('Đang tìm kiếm đối thủ...');
  const [matchData, setMatchData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFinding) {
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFinding]);

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Connect to socket
  const connectSocket = () => {
    setConnectionStatus('connecting');
    
    // Thay đổi URL này thành URL socket server của bạn
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket'],
      query: {
        userId,
        username,
        rank
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to matchmaking server');
      setConnectionStatus('connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from matchmaking server');
      setConnectionStatus('disconnected');
    });

    // Lắng nghe sự kiện queue waiting
    socketInstance.on('queue_waiting', (data: { position: number, total: number }) => {
      setQueueStatus('finding');
      setWaitingMessage(`Đang chờ trong hàng đợi... Vị trí: ${data.position}/${data.total}`);
    });

    // Lắng nghe sự kiện match found
    socketInstance.on('match_found', (data: { 
      matchId: string,
      players: Player[],
      dungeon: string,
      startTime: Date 
    }) => {
      console.log('Match found!', data);
      setQueueStatus('found');
      setMatchData(data);
      setPlayersFound(data.players);
      setWaitingMessage('Đã tìm thấy trận đấu! Đang chuẩn bị...');
      
      // Trigger callback
      if (onMatchFound) {
        onMatchFound(data);
      }
    });

    // Lắng nghe khi có player mới vào queue
    socketInstance.on('player_joined', (player: Player) => {
      setPlayersFound(prev => [...prev, player]);
    });

    // Lắng nghe khi player rời queue
    socketInstance.on('player_left', (playerId: string) => {
      setPlayersFound(prev => prev.filter(p => p.id !== playerId));
    });

    setSocket(socketInstance);
  };

  // Start matchmaking
  const startMatchmaking = () => {
    setIsFinding(true);
    setQueueStatus('finding');
    setTimeElapsed(0);
    setPlayersFound([{
      id: userId,
      username,
      rank,
      ready: true
    }]);
    
    if (!socket || connectionStatus !== 'connected') {
      connectSocket();
    } else {
      // Emit event để join queue
      socket.emit('join_queue', {
        userId,
        username,
        rank
      });
    }
  };

  // Cancel matchmaking
  const cancelMatchmaking = () => {
    setIsFinding(false);
    setQueueStatus('idle');
    setTimeElapsed(0);
    setPlayersFound(prev => [prev[0]]); // Chỉ giữ lại player hiện tại
    
    if (socket && connectionStatus === 'connected') {
      socket.emit('leave_queue', { userId });
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Random loading messages
  const loadingMessages = [
    "Đang triệu hồi quái vật...",
    "Đang chuẩn bị dungeon...",
    "Đang mài kiếm...",
    "Đang pha chế bình mana...",
    "Đang kiểm tra code...",
    "Đang tìm kiếm đối thủ xứng tầm..."
  ];

  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (isFinding) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setCurrentMessage(loadingMessages[randomIndex]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isFinding]);

  return (
    <div className="matchmaking-container">
      {/* Background effects */}
      <div className="matchmaking-bg">
        <div className="portal-effect"></div>
        <div className="particles"></div>
      </div>

      <div className="matchmaking-content">
        {/* Header */}
        <div className="matchmaking-header">
          <h2 className="matchmaking-title">
            <span className="title-icon">⚔️</span>
            TÌM TRẬN
            <span className="title-icon">🗡️</span>
          </h2>
        </div>

        {/* Main content */}
        <div className="matchmaking-body">
          {!isFinding ? (
            // Start screen
            <div className="start-screen">
              <div className="dungeon-preview">
                <div className="dungeon-icon">🏰</div>
                <h3>Chọn chế độ</h3>
                <div className="mode-selector">
                  <button className="mode-btn active">Xếp hạng</button>
                  <button className="mode-btn">Thường</button>
                  <button className="mode-btn">Đồng đội</button>
                </div>
              </div>
              
              <button 
                className="start-finding-btn"
                onClick={startMatchmaking}
              >
                <span className="btn-icon">🎮</span>
                BẮT ĐẦU TÌM TRẬN
                <span className="btn-glow"></span>
              </button>
            </div>
          ) : (
            // Finding screen
            <div className="finding-screen">
              {/* Timer */}
              <div className="timer-container">
                <div className="timer">
                  <span className="timer-icon">⏳</span>
                  <span className="timer-text">{formatTime(timeElapsed)}</span>
                </div>
                <div className="connection-status">
                  <span className={`status-dot ${connectionStatus}`}></span>
                  <span className="status-text">
                    {connectionStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối...'}
                  </span>
                </div>
              </div>

              {/* Spinner */}
              <div className="spinner-container">
                <div className="magic-circle">
                  <div className="circle"></div>
                  <div className="circle-inner"></div>
                  <div className="rune">⚔️</div>
                  <div className="rune">🛡️</div>
                  <div className="rune">⚡</div>
                  <div className="rune">🔥</div>
                </div>
              </div>

              {/* Message */}
              <div className="finding-message">
                <p className="main-message">{waitingMessage}</p>
                <p className="sub-message">{currentMessage}</p>
              </div>

              {/* Players found */}
              <div className="players-found">
                <div className="players-header">
                  <span className="players-count">
                    <span className="count">{playersFound.length}</span>/2
                  </span>
                  <span className="players-label">Người chơi</span>
                </div>

                <div className="players-list">
                  {playersFound.map((player, index) => (
                    <div key={player.id} className="player-card">
                      <div className="player-avatar">
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                          alt={player.username}
                        />
                        <span className={`ready-status ${player.ready ? 'ready' : 'not-ready'}`}>
                          {player.ready ? '✅' : '⏳'}
                        </span>
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.username}</span>
                        <span className="player-rank">{player.rank}</span>
                      </div>
                      {index === 0 && <span className="player-badge">Bạn</span>}
                    </div>
                  ))}

                  {/* Placeholder for missing players */}
                  {Array.from({ length: 2 - playersFound.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="player-card empty">
                      <div className="player-avatar">
                        <div className="empty-avatar">?</div>
                      </div>
                      <div className="player-info">
                        <span className="player-name">Đang tìm...</span>
                        <span className="player-rank">???</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Queue info */}
              <div className="queue-info">
                <div className="queue-stats">
                  <div className="queue-stat">
                    <span className="stat-label">Trong hàng đợi:</span>
                    <span className="stat-value">1,234</span>
                  </div>
                  <div className="queue-stat">
                    <span className="stat-label">Thời gian chờ TB:</span>
                    <span className="stat-value">45s</span>
                  </div>
                </div>
              </div>

              {/* Cancel button */}
              <button 
                className="cancel-btn"
                onClick={cancelMatchmaking}
              >
                <span className="btn-icon">❌</span>
                HỦY TÌM TRẬN
              </button>
            </div>
          )}
        </div>

        {/* Tips */}
        {!isFinding && (
          <div className="matchmaking-tips">
            <div className="tip">
              <span className="tip-icon">💡</span>
              <span className="tip-text">Chế độ xếp hạng sẽ ảnh hưởng đến rank của bạn</span>
            </div>
            <div className="tip">
              <span className="tip-icon">⚡</span>
              <span className="tip-text">Thời gian chờ trung bình: 30-60 giây</span>
            </div>
          </div>
        )}
      </div>

      {/* Match found modal */}
      {queueStatus === 'found' && matchData && (
        <div className="match-found-modal">
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-icon">🏆</span>
              <h3>MATCH FOUND!</h3>
              <span className="modal-icon">🏆</span>
            </div>
            
            <div className="match-details">
              <div className="dungeon-info">
                <span className="dungeon-icon">🏰</span>
                <span className="dungeon-name">{matchData.dungeon}</span>
              </div>
              
              <div className="vs-container">
                <div className="team team-left">
                  {matchData.players.slice(0, 1).map((player: Player) => (
                    <div key={player.id} className="vs-player">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} alt="" />
                      <span>{player.username}</span>
                    </div>
                  ))}
                </div>
                
                <div className="vs-divider">VS</div>
                
                <div className="team team-right">
                  {matchData.players.slice(1).map((player: Player) => (
                    <div key={player.id} className="vs-player">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} alt="" />
                      <span>{player.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="accept-btn" onClick={() => window.location.href = `/dungeon/${matchData.matchId}`}>
                <span>⚔️ VÀO DUNGEON ⚔️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matchmaking;