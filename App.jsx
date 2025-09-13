// import React, { useState } from 'react';
// import VideoCallComponent from './VideoCallComponent';
// import './App.css';

// function App() {
//     const [userId, setUserId] = useState('1001'); // Default user ID
//     const [callLogs, setCallLogs] = useState([]);

//     const handleCallStatusChange = (status, callData) => {
//         const log = {
//             timestamp: new Date().toLocaleTimeString(),
//             status,
//             callData
//         };
//         setCallLogs(prev => [...prev, log]);
//         console.log('Call status changed:', status, callData);
//     };

//     return (
//         <div className="App">
//             <header className="App-header">
//                 <h1>🎥 Agora Video Calling App</h1>
                
//                 {/* User ID Input */}
//                 <div className="user-input">
//                     <label htmlFor="userId">User ID:</label>
//                     <input
//                         id="userId"
//                         type="text"
//                         value={userId}
//                         onChange={(e) => setUserId(e.target.value)}
//                         placeholder="Enter your User ID"
//                     />
//                 </div>

//                 {/* Video Call Component */}
//                 <VideoCallComponent 
//                     userId={userId}
//                     onCallStatusChange={handleCallStatusChange}
//                 />

//                 {/* Call Logs */}
//                 <div className="call-logs">
//                     <h3>📋 Call Logs</h3>
//                     <div className="logs-container">
//                         {callLogs.map((log, index) => (
//                             <div key={index} className={`log-item ${log.status}`}>
//                                 <span className="timestamp">{log.timestamp}</span>
//                                 <span className="status">{log.status}</span>
//                                 {log.callData && (
//                                     <span className="call-data">
//                                         {JSON.stringify(log.callData, null, 2)}
//                                     </span>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </header>
//         </div>
//     );
// }

// export default App;

