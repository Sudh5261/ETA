import React, { useState, useEffect } from 'react';
import { 
  Zap, Flame, ShieldAlert, Clock, Layers, Navigation, Footprints, QrCode, Cpu, 
  Users, Building2, TrendingUp, Sun, Moon, User, LogOut 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

const FLOORS = ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'G'];
const FLOOR_NUMS = { 'G': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9 };

const BLOCKS = [
  { id: 'b38', name: 'Block 38 - Department of Computer Applications', totalFloors: 9, avgCrowd: 'Extreme' },
  { id: 'b37', name: 'Block 37 - School of Computer Science & Engg', totalFloors: 9, avgCrowd: 'High' },
  { id: 'b34', name: 'Block 34 - IT & Software Systems', totalFloors: 9, avgCrowd: 'High' },
  { id: 'b32', name: 'Block 32 - Mechanical & Civil Engg', totalFloors: 9, avgCrowd: 'Medium' },
];

const ANALYTICS_DATA = [
  { time: '08:00 AM', traditionalWait: 4.5, liftSyncWait: 1.2, stairNudges: 12 },
  { time: '08:30 AM', traditionalWait: 8.2, liftSyncWait: 2.1, stairNudges: 45 },
  { time: '09:00 AM (Peak)', traditionalWait: 12.5, liftSyncWait: 3.4, stairNudges: 89 },
  { time: '09:30 AM', traditionalWait: 6.0, liftSyncWait: 1.8, stairNudges: 34 },
  { time: '10:00 AM', traditionalWait: 3.8, liftSyncWait: 1.1, stairNudges: 18 },
  { time: '10:30 AM', traditionalWait: 7.4, liftSyncWait: 2.3, stairNudges: 52 },
];

const FITNESS_QUOTES = [
  "“Step by step, floor by floor! Skipping the lift burns calories and saves time.”",
  "“Taking the stairs for 2 floors is faster than waiting for a lift in peak traffic!”",
  "“Your body will thank you later. Earn your daily steps today!”",
  "“Small daily steps create massive long-term health gains.”",
  "“Be the reason an elevator stays free for someone who truly needs it!”",
  "“Cardio unlocked! 2 flights of stairs equal 15 extra calories burned.”",
  "“Don't wait for the lift when your legs are ready to move!”"
];

export default function LiftSync() {
  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', regId: '', password: '' });
  const [authError, setAuthError] = useState('');

  // Dashboard Settings
  const [theme, setTheme] = useState('dark');
  const [selectedBlock, setSelectedBlock] = useState(BLOCKS[0].id);
  const [isPeakHour, setIsPeakHour] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [floorDemand, setFloorDemand] = useState({
    '9': 0, '8': 0, '7': 0, '6': 0, '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, 'G': 0
  });

  const [lifts, setLifts] = useState({
    A: { id: 'A', name: 'High-Zone Express', currentFloor: 0, targetQueue: [], direction: 'idle', occupancy: 0, assignedFloor: null },
    B: { id: 'B', name: 'Mid-Zone Shuttle', currentFloor: 0, targetQueue: [], direction: 'idle', occupancy: 0, assignedFloor: null },
    C: { id: 'C', name: 'General All-Stop', currentFloor: 0, targetQueue: [], direction: 'idle', occupancy: 0, assignedFloor: null },
  });

  const [selectedFloor, setSelectedFloor] = useState(null);
  const [showStairModal, setShowStairModal] = useState(false);
  const [activeQuote, setActiveQuote] = useState("");
  const [activeBoardingPass, setActiveBoardingPass] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [logs, setLogs] = useState([{ id: 1, time: '09:14:00', text: 'Smart Life System Initialized.', type: 'info' }]);

  const [stats, setStats] = useState({
    dispatches: 142,
    stairsAccepted: 48,
    energySaved: 54.2
  });

  useEffect(() => {
    const savedSession = localStorage.getItem('smart_life_session');
    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
    }
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0 && isSimRunning) {
      timer = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, isSimRunning]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    const users = JSON.parse(localStorage.getItem('smart_life_users') || '[]');

    if (authMode === 'signup') {
      if (!authForm.name || !authForm.regId || !authForm.password) {
        setAuthError('Please fill in all fields.');
        return;
      }

      const existingUser = users.find(u => u.regId.trim().toLowerCase() === authForm.regId.trim().toLowerCase());
      if (existingUser) {
        setAuthError('An account with this LPU Registration ID already exists.');
        return;
      }

      const newUser = { name: authForm.name, regId: authForm.regId.trim(), password: authForm.password };
      users.push(newUser);
      localStorage.setItem('smart_life_users', JSON.stringify(users));
      localStorage.setItem('smart_life_session', JSON.stringify(newUser));
      setCurrentUser(newUser);
      addLog(`New student registered: ${newUser.name} (${newUser.regId})`, 'info');
    } else {
      const user = users.find(u => u.regId.trim().toLowerCase() === authForm.regId.trim().toLowerCase() && u.password === authForm.password);
      if (!user) {
        setAuthError('Invalid Registration ID or Password.');
        return;
      }

      localStorage.setItem('smart_life_session', JSON.stringify(user));
      setCurrentUser(user);
      addLog(`Student logged in: ${user.name} (${user.regId})`, 'info');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_life_session');
    setCurrentUser(null);
    addLog('User logged out.', 'info');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const togglePeakHourMode = () => {
    const nextState = !isPeakHour;
    setIsPeakHour(nextState);
    if (nextState) {
      addLog('🔥 PEAK TRAFFIC MODE ENABLED: Door delay reduced to 25 seconds.', 'warning');
    } else {
      addLog('NORMAL TRAFFIC MODE RESTORED: Standard 30-second door timing active.', 'info');
    }
  };

  const handleBlockChange = (blockId) => {
    setSelectedBlock(blockId);
    const blockObj = BLOCKS.find(b => b.id === blockId);
    addLog(`Switched active monitoring network to ${blockObj.name}.`, 'info');
  };

  useEffect(() => {
    if (!isSimRunning || emergencyActive) return;

    const interval = setInterval(() => {
      setLifts((prev) => {
        const next = { ...prev };
        let updated = false;

        Object.keys(next).forEach((key) => {
          let lift = { ...next[key] };

          if (lift.targetQueue.length > 0) {
            updated = true;
            const target = lift.targetQueue[0];

            if (lift.currentFloor < target) {
              lift.currentFloor += 1;
              lift.direction = 'up';
            } else if (lift.currentFloor > target) {
              lift.currentFloor -= 1;
              lift.direction = 'down';
            } else {
              lift.targetQueue.shift();
              
              if (lift.targetQueue.length > 0) {
                lift.direction = lift.targetQueue[0] > lift.currentFloor ? 'up' : 'down';
              } else {
                lift.direction = 'idle';
                lift.assignedFloor = null;
                if (lift.currentFloor === 0) {
                  lift.occupancy = 0;
                }
              }

              const reachedLabel = Object.keys(FLOOR_NUMS).find(k => FLOOR_NUMS[k] === target);
              if (reachedLabel) {
                setFloorDemand(fd => ({ ...fd, [reachedLabel]: Math.max(0, fd[reachedLabel] - 15) }));
              }
            }
          } else {
            lift.direction = 'idle';
          }
          next[key] = lift;
        });

        return updated ? next : prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimRunning, emergencyActive]);

  const addLog = (text, type = 'info') => {
    setLogs((prev) => [{ id: Date.now(), time: new Date().toLocaleTimeString(), text, type }, ...prev.slice(0, 19)]);
  };

  const handleFloorSelection = (floorStr) => {
    const targetFloorNum = FLOOR_NUMS[floorStr];
    setSelectedFloor(floorStr);

    if (targetFloorNum === 1 || targetFloorNum === 2) {
      const randomQuote = FITNESS_QUOTES[Math.floor(Math.random() * FITNESS_QUOTES.length)];
      setActiveQuote(randomQuote);
      setShowStairModal(true);
      return;
    }

    processDispatch(targetFloorNum, floorStr);
  };

  const calculateRealETA = (lift, targetFloorNum) => {
    const floorDistance = Math.abs(lift.currentFloor - targetFloorNum);
    const travelTimeSeconds = floorDistance * 1.5;
    const doorDwellTime = isPeakHour ? 25 : 30;
    const doorDelaySeconds = lift.targetQueue.length * doorDwellTime;
    
    return Math.round(travelTimeSeconds + doorDelaySeconds);
  };

  const processDispatch = (targetFloorNum, floorLabel) => {
    if (emergencyActive) {
      alert("System Suspended! Emergency Halt is active.");
      return;
    }

    const newCount = (floorDemand[floorLabel] || 0) + 1;
    setFloorDemand(prev => ({ ...prev, [floorLabel]: newCount }));

    let chosenLiftKey = null;

    Object.keys(lifts).forEach(key => {
      if (lifts[key].assignedFloor === targetFloorNum || (lifts[key].direction === 'idle' && lifts[key].currentFloor === targetFloorNum)) {
        chosenLiftKey = key;
      }
    });

    if (!chosenLiftKey) {
      const idleLiftKey = Object.keys(lifts).find(key => lifts[key].direction === 'idle');
      
      if (idleLiftKey) {
        chosenLiftKey = idleLiftKey;
      } else {
        let minQueueLen = Infinity;
        Object.keys(lifts).forEach(key => {
          if (lifts[key].targetQueue.length < minQueueLen) {
            minQueueLen = lifts[key].targetQueue.length;
            chosenLiftKey = key;
          }
        });
      }
    }

    const assignedLift = lifts[chosenLiftKey];
    const calculatedETA = Math.max(5, calculateRealETA(assignedLift, targetFloorNum));

    setLifts((prev) => ({
      ...prev,
      [chosenLiftKey]: {
        ...prev[chosenLiftKey],
        assignedFloor: targetFloorNum,
        occupancy: Math.min(100, prev[chosenLiftKey].occupancy + 15),
        targetQueue: Array.from(new Set([...prev[chosenLiftKey].targetQueue, targetFloorNum]))
      }
    }));

    setActiveBoardingPass({
      liftId: chosenLiftKey,
      liftName: assignedLift.name,
      targetFloor: floorLabel,
      etaSeconds: calculatedETA
    });

    setCountdown(calculatedETA);
    setStats(s => ({ ...s, dispatches: s.dispatches + 1 }));
    const activeBlockObj = BLOCKS.find(b => b.id === selectedBlock);
    const modeLabel = isPeakHour ? "PEAK (25s Door Dwell)" : "NORMAL (30s Door Dwell)";
    addLog(`[${activeBlockObj.id.toUpperCase()}] FL ${floorLabel} ➔ Lift ${chosenLiftKey} (${modeLabel} ETA: ${calculatedETA}s)`, 'dispatch');
  };

  const triggerFloor9Surge = () => {
    setFloorDemand(prev => ({ ...prev, '9': 45 }));
    setLifts(prev => ({
      A: { ...prev.A, assignedFloor: 9, targetQueue: [9], occupancy: 95 },
      B: { ...prev.B, assignedFloor: 9, targetQueue: [9], occupancy: 90 },
      C: { ...prev.C, assignedFloor: 9, targetQueue: [9], occupancy: 85 },
    }));
    addLog('🚀 100+ STUDENTS SURGE AT FL 9: All 3 Lifts (A, B, C) dispatched to Floor 9!', 'warning');
  };

  return (
    <div className="app-container">
      
      {/* AUTH SCREEN */}
      {!currentUser && (
        <div className="auth-overlay">
          <div className="auth-card">
            
            <div className="auth-logo-badge">
              <Zap size={36} />
            </div>

            <h2 className="auth-title">
              {authMode === 'login' ? 'Welcome Back' : 'Student Registration'}
            </h2>
            <p className="auth-subtitle">
              {authMode === 'login' ? 'Sign in with your LPU Registration ID' : 'Register your campus account to access Smart Life ETA'}
            </p>

            {authError && (
              <div className="auth-error-badge">
                {authError}
              </div>
            )}

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === 'signup' && (
                <div className="auth-input-group">
                  <label className="auth-label">Full Name</label>
                  <input 
                    type="text" 
                    className="auth-input" 
                    placeholder="xyz" 
                    value={authForm.name} 
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })} 
                  />
                </div>
              )}

              <div className="auth-input-group">
                <label className="auth-label">LPU Registration ID</label>
                <input 
                  type="text" 
                  className="auth-input" 
                  placeholder="126000000" 
                  value={authForm.regId} 
                  onChange={e => setAuthForm({ ...authForm, regId: e.target.value })} 
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Password</label>
                <input 
                  type="password" 
                  className="auth-input" 
                  placeholder="••••••••" 
                  value={authForm.password} 
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })} 
                />
              </div>

              <button type="submit" className="auth-submit-btn">
                {authMode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
              </button>
            </form>

            <button 
              type="button"
              className="auth-bypass-btn"
              onClick={() => {
                const guestUser = { name: 'xyz', regId: '126000000' };
                setCurrentUser(guestUser);
                addLog('Entered system via Demo Guest mode.', 'info');
              }}
            >
              ⚡ Quick Demo Access (Bypass Login)
            </button>

            <p className="auth-toggle-text">
              {authMode === 'login' ? "Don't have an account?" : "Already registered?"}
              <button 
                type="button"
                className="auth-toggle-btn" 
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthError('');
                }}
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>

          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="top-header">
        <div className="header-brand">
          <Zap className="brand-icon" size={48} />
          <div className="brand-titles">
            <h1>Smart Life ETA & Priority System <span className="version-badge">v3.4</span></h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Campus-wide Dynamic ETA & Intelligent Traffic Dispatching
            </span>
          </div>
        </div>

        <div className="header-controls">
          {currentUser && (
            <div className="user-badge">
              <User size={16} color="var(--brand-blue)" />
              <span>{currentUser.name} ({currentUser.regId})</span>
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: '6px' }} title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          )}

          <button className="control-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} color="var(--brand-amber)" /> : <Moon size={18} color="var(--brand-purple)" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>

          <div className="control-btn" style={{ padding: '4px 12px' }}>
            <Building2 size={18} color="var(--brand-blue)" />
            <select 
              value={selectedBlock} 
              onChange={(e) => handleBlockChange(e.target.value)}
              style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {BLOCKS.map(b => (
                <option key={b.id} value={b.id} style={{ background: 'var(--bg-panel)', color: 'var(--text-main)' }}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button className={`control-btn btn-peak ${isPeakHour ? 'active' : ''}`} onClick={togglePeakHourMode}>
            <Flame size={18} /> {isPeakHour ? 'Peak Traffic (25s Door)' : 'Peak Traffic'}
          </button>
          
          <button className={`control-btn btn-emergency ${emergencyActive ? 'active' : ''}`} onClick={() => setEmergencyActive(!emergencyActive)}>
            <ShieldAlert size={18} /> HALT
          </button>
          
          <div className="control-btn"><Clock size={18} /> {currentTime.toLocaleTimeString()}</div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <div className="dashboard-layout">
        
        {/* SHAFT MONITORING */}
        <div className="panel flex flex-col justify-between">
          <div className="panel-header">
            <div>
              <h2 className="panel-title"><Layers color="var(--brand-blue)" /> 9-Floor Shaft Visualizer</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {BLOCKS.find(b => b.id === selectedBlock)?.name}
              </span>
            </div>
            <button onClick={triggerFloor9Surge} className="control-btn btn-peak" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              <Users size={14} /> Simulate 100+ Students for FL 9
            </button>
          </div>
          
          <div className="shaft-grid">
            <div className="floor-labels">
              {FLOORS.map((fl) => (
                <div key={fl} className="floor-row">
                  <span>FL {fl}</span>
                  <span className="fl-zone" style={{ color: floorDemand[fl] > 10 ? 'var(--brand-red)' : 'var(--text-muted)' }}>
                    {floorDemand[fl] > 0 ? `${floorDemand[fl]} waiting` : 'Clear'}
                  </span>
                </div>
              ))}
            </div>
            
            {Object.keys(lifts).map((key) => {
              const lift = lifts[key];
              const bottomPercent = (FLOOR_NUMS[lift.currentFloor] / 9) * 88.8;
              const neonClass = key === 'A' ? 'lift-a' : key === 'B' ? 'lift-b' : 'lift-c';
              
              return (
                <div key={key} className="shaft-column">
                  <div className="shaft-lines">{FLOORS.map((_, i) => <div key={i}></div>)}</div>
                  
                  <div className={`lift-car ${neonClass}`} style={{ bottom: `${bottomPercent}%` }}>
                    <div className="lift-car-header">
                      <span>FL {lift.currentFloor} ({lift.direction.toUpperCase()})</span>
                      <span>{lift.occupancy}% Load</span>
                    </div>
                    <div className="load-bar-bg">
                      <div className="load-bar-fill" style={{ width: `${lift.occupancy}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KIOSK CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel">
            <h2 className="panel-title" style={{ marginBottom: '20px' }}><Navigation color="var(--brand-blue)" /> Student Kiosk (G - 9)</h2>
            <div className="keypad-grid">
              {FLOORS.map((fl) => (
                <button 
                  key={fl} 
                  className={`keypad-btn ${selectedFloor === fl ? 'active' : ''} ${fl === '1' || fl === '2' ? 'stair-btn' : ''}`}
                  onClick={() => handleFloorSelection(fl)}
                >
                  {fl}
                  {floorDemand[fl] > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--brand-amber)' }}>({floorDemand[fl]} reqs)</span>}
                </button>
              ))}
            </div>

            {activeBoardingPass && (
              <div className="boarding-pass">
                <div className="pass-header">
                  <div>
                    <div style={{ color: 'var(--brand-blue)', fontSize: '0.75rem', fontWeight: 'bold' }}>DESTINATION DISPATCH TICKET</div>
                    <div className="pass-title">PROCEED TO LIFT {activeBoardingPass.liftId}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeBoardingPass.liftName}</div>
                  </div>
                  <QrCode size={44} />
                </div>
                <div className="pass-stats">
                  <div className="stat-box">Target Floor: <br /><b>Floor {activeBoardingPass.targetFloor}</b></div>
                  <div className="stat-box" style={{ color: 'var(--brand-green)' }}>
                    Accurate ETA: <br /><b>{countdown}s</b> {isPeakHour && <span style={{fontSize: '0.65rem', color: 'var(--brand-amber)'}}>(25s Peak)</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title"><Cpu color="var(--brand-purple)" /> Engine Logs</h2>
            <div className="log-box">
              {logs.map((lg) => (
                <div key={lg.id} className="log-entry">
                  <span className="log-time">{lg.time}</span>
                  <span style={{ color: lg.type === 'warning' ? 'var(--brand-amber)' : lg.type === 'dispatch' ? 'var(--brand-blue)' : 'inherit' }}>
                    {lg.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 className="panel-title"><TrendingUp color="var(--brand-green)" /> Peak-Hour Analytics & Impact</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live comparative wait times & stair conversion metrics</span>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL DISPATCHES</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-blue)' }}>{stats.dispatches}</span>
            </div>
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>STAIR CONVERSIONS</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-green)' }}>{stats.stairsAccepted}</span>
            </div>
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>ENERGY SAVED</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--brand-amber)' }}>{stats.energySaved.toFixed(1)} kWh</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '260px' }}>
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '12px' }}>
              Average Wait Time (Minutes): Traditional vs Smart Life System
            </span>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={ANALYTICS_DATA}>
                <defs>
                  <linearGradient id="colorTrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSync" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', fontSize: '12px', color: 'var(--text-main)' }} />
                <Area type="monotone" dataKey="traditionalWait" name="Traditional Wait" stroke="#ef4444" fillOpacity={1} fill="url(#colorTrad)" />
                <Area type="monotone" dataKey="liftSyncWait" name="Smart Life Wait" stroke="#10b981" fillOpacity={1} fill="url(#colorSync)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'block', marginBottom: '12px' }}>
              Stair Nudge Conversions
            </span>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={ANALYTICS_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={9} />
                <YAxis stroke="var(--text-muted)" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', fontSize: '12px', color: 'var(--text-main)' }} />
                <Bar dataKey="stairNudges" name="Stair Walkers" fill="var(--brand-blue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* STAIR NUDGE MODAL */}
      {showStairModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Footprints size={48} color="var(--brand-green)" style={{ margin: '0 auto 16px auto' }} />
            <h2 style={{ marginBottom: '8px', fontSize: '1.4rem' }}>Take the Stairs!</h2>
            
            <div style={{ 
              background: 'var(--bg-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '12px', 
              marginBottom: '16px',
              color: 'var(--brand-green)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              fontWeight: '500'
            }}>
              {activeQuote}
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Taking the stairs to Floor {selectedFloor} takes under 30 seconds and keeps elevator capacity free for upper floors (7-9).
            </p>

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => {
                setShowStairModal(false);
                setStats(s => ({ 
                  ...s, 
                  stairsAccepted: s.stairsAccepted + 1,
                  energySaved: s.energySaved + 0.25 
                }));
                addLog(`User accepted Stairs for Floor ${selectedFloor}. Energy Saved!`, 'info');
              }}>Take Stairs 🏃‍♂️</button>
              
              <button className="btn-secondary" onClick={() => {
                setShowStairModal(false);
                processDispatch(FLOOR_NUMS[selectedFloor], selectedFloor);
              }}>Wait for Lift</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}