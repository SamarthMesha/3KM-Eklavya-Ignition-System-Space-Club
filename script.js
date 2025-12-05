// Global variables
let countdownInterval;
let totalCountdownSeconds = 0;
let countdownActive = false;
let countdownPaused = false;
let remainingSeconds = 0;

// Firebase reference
let database;
let analytics;
let logEventFunction;

// Initialize when page loads
window.addEventListener('load', function() {
    // Initialize Firebase if available
    if (window.firebaseDatabase) {
        database = window.firebaseDatabase;
        analytics = window.firebaseAnalytics;
        logEventFunction = window.firebaseLogEvent;
        console.log("Firebase initialized in script.js");
    }
    
    // Check if there's a countdown in progress in localStorage
    const savedCountdown = localStorage.getItem('countdownActive');
    if (savedCountdown === 'true') {
        const savedTime = localStorage.getItem('remainingSeconds');
        if (savedTime) {
            remainingSeconds = parseInt(savedTime);
            if (remainingSeconds > 0) {
                countdownActive = true;
                resumeCountdown();
            }
        }
    }
});

// Prevent page refresh during countdown
window.addEventListener('beforeunload', function(e) {
    if (countdownActive && !countdownPaused) {
        e.preventDefault();
        e.returnValue = '';
        document.getElementById('refreshWarning').classList.add('active');
        return '';
    }
});

// Continue button for refresh warning
document.getElementById('continueBtn').addEventListener('click', function() {
    document.getElementById('refreshWarning').classList.remove('active');
});

// Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle eye icon
    this.textContent = type === 'password' ? '👁️' : '🔒';
});

// Login functionality
document.getElementById('loginBtn').addEventListener('click', function() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === '2315046' && password === '2315046') {
        // Show the access notification
        const accessNote = document.getElementById('accessNotification');
        const timeNow = new Date().toLocaleTimeString();
        document.getElementById('accessTime').textContent = timeNow;
        
        accessNote.classList.add('active');
        
        // After showing the notification, proceed to dashboard
        setTimeout(() => {
            accessNote.classList.remove('active');
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            addLogEntry("User 2315046 authenticated successfully");
            addLogEntry("Control systems initialized");
            
            // Log login event to Firebase Analytics if available
            if (analytics && logEventFunction) {
                logEventFunction(analytics, 'login', {
                    method: 'manual',
                    user_id: username
                });
            }
        }, 2500);
    } else {
        alert('Invalid credentials. Please check your username and password.');
    }
});

document.getElementById('resetBtn').addEventListener('click', function() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
});

// Function to update Fire Enable status
function updateFireEnableStatus() {
    const check1 = document.getElementById('check1').classList.contains('checked');
    const check2 = document.getElementById('check2').classList.contains('checked');
    const fireEnable = document.getElementById('check3');
    
    if (check1 && check2) {
        // Both Pre-Ignition and Arm Command are active
        fireEnable.classList.remove('disabled');
        addLogEntry("Fire Enable step now available");
    } else {
        // Either Pre-Ignition or Arm Command is inactive
        fireEnable.classList.add('disabled');
        fireEnable.classList.remove('checked');
        addLogEntry("Fire Enable step deactivated - requires both Pre-Ignition and Arm Command");
    }
}

// Sequence checkboxes
const checkboxes = ['check1', 'check2', 'check3'];
checkboxes.forEach(id => {
    document.getElementById(id).addEventListener('click', function() {
        // Check if this checkbox is disabled
        if (this.classList.contains('disabled')) {
            return;
        }
        
        this.classList.toggle('checked');
        if (this.classList.contains('checked')) {
            addLogEntry(`Sequence step completed: ${this.parentElement.textContent.trim()}`);
            
            // Update Fire Enable status when Pre-Ignition or Arm Command changes
            if (id === 'check1' || id === 'check2') {
                updateFireEnableStatus();
            }
        } else {
            addLogEntry(`Sequence step deactivated: ${this.parentElement.textContent.trim()}`);
            
            // Update Fire Enable status when Pre-Ignition or Arm Command changes
            if (id === 'check1' || id === 'check2') {
                updateFireEnableStatus();
            }
        }
    });
});

// Initiate sequence
document.getElementById('initiateBtn').addEventListener('click', function() {
    // Check if all steps are completed
    const allChecked = checkboxes.every(id => 
        document.getElementById(id).classList.contains('checked')
    );
    
    if (!allChecked) {
        addLogEntry("Error: Complete all sequence steps first", "warning");
        return;
    }
    
    addLogEntry("All sequence steps completed");
    
    // Show confirmation notification
    document.getElementById('confirmationNotification').classList.add('active');
});

// Confirm sequence
document.getElementById('confirmBtn').addEventListener('click', function() {
    document.getElementById('confirmationNotification').classList.remove('active');
    addLogEntry("Ignition sequence confirmed");
    addLogEntry("Initiating countdown sequence");
    
    // Hide sequence panel, show countdown panel
    document.getElementById('sequencePanel').style.display = 'none';
    document.getElementById('countdownPanel').style.display = 'block';
});

// Cancel confirmation
document.getElementById('cancelConfirmBtn').addEventListener('click', function() {
    document.getElementById('confirmationNotification').classList.remove('active');
    addLogEntry("Countdown sequence cancelled");
});

// Countdown controls
document.getElementById('startCountdownBtn').addEventListener('click', function() {
    const hours = parseInt(document.getElementById('hoursInput').value) || 0;
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    
    totalCountdownSeconds = hours * 3600 + minutes * 60 + seconds;
    
    if (totalCountdownSeconds <= 0) {
        addLogEntry("Error: Set a valid countdown time", "warning");
        return;
    }
    
    startCountdown(totalCountdownSeconds);
});

document.getElementById('cancelCountdownBtn').addEventListener('click', function() {
    clearInterval(countdownInterval);
    countdownActive = false;
    localStorage.removeItem('countdownActive');
    localStorage.removeItem('remainingSeconds');
    document.getElementById('countdownDisplay').textContent = '00:00:00';
    document.getElementById('countdownPanel').style.display = 'none';
    document.getElementById('sequencePanel').style.display = 'block';
    addLogEntry("Countdown cancelled");
});

// Control buttons
document.getElementById('abortBtn').addEventListener('click', function() {
    clearInterval(countdownInterval);
    countdownActive = false;
    localStorage.removeItem('countdownActive');
    localStorage.removeItem('remainingSeconds');
    document.getElementById('countdownDisplay').textContent = '00:00:00';
    document.getElementById('countdownPanel').style.display = 'none';
    document.getElementById('sequencePanel').style.display = 'block';
    document.getElementById('confirmationNotification').classList.remove('active');
    addLogEntry("ABORT sequence initiated", "warning");
    resetSequence();
});

document.getElementById('pauseBtn').addEventListener('click', function() {
    if (countdownActive && !countdownPaused) {
        clearInterval(countdownInterval);
        countdownPaused = true;
        addLogEntry("Countdown paused");
        document.getElementById('pauseBtn').textContent = "RESUME";
    } else if (countdownActive && countdownPaused) {
        startCountdown(remainingSeconds);
        countdownPaused = false;
        addLogEntry("Countdown resumed");
        document.getElementById('pauseBtn').textContent = "PAUSE";
    }
});

document.getElementById('overrideBtn').addEventListener('click', function() {
    addLogEntry("Manual override engaged", "warning");
    // Optionally trigger immediate ignition on override
    // triggerIgnition();
});

// FIREBASE IGNITION FUNCTION
async function triggerIgnition() {
    if (database) {
        try {
            // Import Firebase Database functions
            const { set, ref } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
            const ignitionRef = ref(database, "ignition");
            
            const ignitionData = {
                status: "FIRE",
                timestamp: Date.now(),
                mission: "Eklavya Rocket Launch",
                user: "2315046"
            };
            
            await set(ignitionRef, ignitionData);
            addLogEntry("Fire command sent to Firebase: " + JSON.stringify(ignitionData));
            console.log("Firebase ignition triggered:", ignitionData);
            
            // Log analytics event
            if (analytics && logEventFunction) {
                logEventFunction(analytics, 'ignition_triggered', {
                    mission_id: 'eklavya_launch',
                    user_id: '2315046',
                    timestamp: Date.now()
                });
            }
            
            return true;
        } catch (error) {
            console.error("Error triggering ignition:", error);
            addLogEntry("Error sending fire command to Firebase: " + error.message, "warning");
            return false;
        }
    } else {
        addLogEntry("Firebase not initialized. Cannot send fire command.", "warning");
        console.error("Firebase database not initialized");
        return false;
    }
}

// Helper functions
function addLogEntry(message, type = "normal") {
    const log = document.getElementById('eventLog');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    
    if (type === "warning") {
        entry.classList.add('warning');
    }
    
    const time = new Date();
    const timeString = time.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    entry.innerHTML = `<span class="log-time">${timeString}</span> <span>${message}</span>`;
    
    log.insertBefore(entry, log.firstChild);
    
    // Keep log to 15 entries max
    if (log.children.length > 15) {
        log.removeChild(log.lastChild);
    }
}

function startCountdown(totalSeconds) {
    remainingSeconds = totalSeconds;
    countdownActive = true;
    countdownPaused = false;
    updateCountdownDisplay(remainingSeconds);
    addLogEntry(`Countdown started: ${formatTime(remainingSeconds)}`);
    
    // Save countdown state to localStorage
    localStorage.setItem('countdownActive', 'true');
    localStorage.setItem('remainingSeconds', remainingSeconds);
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        updateCountdownDisplay(remainingSeconds);
        
        // Update localStorage with remaining time
        localStorage.setItem('remainingSeconds', remainingSeconds);
        
        if (remainingSeconds <= 10) {
            document.getElementById('countdownDisplay').style.color = 'var(--warning)';
            document.getElementById('countdownDisplay').style.textShadow = '0 0 10px rgba(255, 85, 85, 0.5)';
            
            // Add T-minus announcement for last 10 seconds
            if (remainingSeconds <= 10 && remainingSeconds > 0) {
                addLogEntry(`T-minus ${remainingSeconds} seconds...`);
            }
        }
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownActive = false;
            localStorage.removeItem('countdownActive');
            localStorage.removeItem('remainingSeconds');
            addLogEntry("Countdown complete! Ignition sequence finished!");
            
            // TRIGGER IGNITION via Firebase
            triggerIgnition().then(ignitionSuccess => {
                if (!ignitionSuccess) {
                    addLogEntry("WARNING: Firebase ignition command failed!", "warning");
                }
                
                // Show ignition notification
                const ignitionNote = document.getElementById('ignitionNotification');
                const ignitionMessage = document.getElementById('ignitionMessage');
                
                if (ignitionSuccess) {
                    ignitionMessage.textContent = "Countdown complete. Rocket ignition initiated via Firebase.";
                } else {
                    ignitionMessage.textContent = "Countdown complete. WARNING: Firebase ignition command failed!";
                }
                
                ignitionNote.classList.add('active');
                
                // After ignition notification, show mission complete panel
                setTimeout(() => {
                    ignitionNote.classList.remove('active');
                    document.getElementById('countdownPanel').style.display = 'none';
                    document.getElementById('missionCompletePanel').style.display = 'block';
                    
                    // Set mission completion stats
                    document.getElementById('launchTime').textContent = formatTime(totalCountdownSeconds);
                    const completionTime = new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
                    document.getElementById('completionTime').textContent = completionTime;
                    
                    // Reset countdown display style
                    document.getElementById('countdownDisplay').style.color = '';
                    document.getElementById('countdownDisplay').style.textShadow = '';
                    
                    addLogEntry("Mission complete. All systems nominal.");
                }, 3000);
            });
        }
    }, 1000);
}

function resumeCountdown() {
    updateCountdownDisplay(remainingSeconds);
    addLogEntry(`Countdown resumed: ${formatTime(remainingSeconds)}`);
    
    // Hide sequence panel, show countdown panel
    document.getElementById('sequencePanel').style.display = 'none';
    document.getElementById('countdownPanel').style.display = 'block';
    
    countdownInterval = setInterval(() => {
        remainingSeconds--;
        updateCountdownDisplay(remainingSeconds);
        
        // Update localStorage with remaining time
        localStorage.setItem('remainingSeconds', remainingSeconds);
        
        if (remainingSeconds <= 10) {
            document.getElementById('countdownDisplay').style.color = 'var(--warning)';
            document.getElementById('countdownDisplay').style.textShadow = '0 0 10px rgba(255, 85, 85, 0.5)';
            
            // Add T-minus announcement for last 10 seconds
            if (remainingSeconds <= 10 && remainingSeconds > 0) {
                addLogEntry(`T-minus ${remainingSeconds} seconds...`);
            }
        }
        
        if (remainingSeconds <= 0) {
            clearInterval(countdownInterval);
            countdownActive = false;
            localStorage.removeItem('countdownActive');
            localStorage.removeItem('remainingSeconds');
            addLogEntry("Countdown complete! Ignition sequence finished!");
            
            // TRIGGER IGNITION via Firebase
            triggerIgnition().then(ignitionSuccess => {
                if (!ignitionSuccess) {
                    addLogEntry("WARNING: Firebase ignition command failed!", "warning");
                }
                
                // Show ignition notification
                const ignitionNote = document.getElementById('ignitionNotification');
                const ignitionMessage = document.getElementById('ignitionMessage');
                
                if (ignitionSuccess) {
                    ignitionMessage.textContent = "Countdown complete. Rocket ignition initiated via Firebase.";
                } else {
                    ignitionMessage.textContent = "Countdown complete. WARNING: Firebase ignition command failed!";
                }
                
                ignitionNote.classList.add('active');
                
                // After ignition notification, show mission complete panel
                setTimeout(() => {
                    ignitionNote.classList.remove('active');
                    document.getElementById('countdownPanel').style.display = 'none';
                    document.getElementById('missionCompletePanel').style.display = 'block';
                    
                    // Set mission completion stats
                    document.getElementById('launchTime').textContent = formatTime(totalCountdownSeconds);
                    const completionTime = new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'});
                    document.getElementById('completionTime').textContent = completionTime;
                    
                    // Reset countdown display style
                    document.getElementById('countdownDisplay').style.color = '';
                    document.getElementById('countdownDisplay').style.textShadow = '';
                    
                    addLogEntry("Mission complete. All systems nominal.");
                }, 3000);
            });
        }
    }, 1000);
}

function updateCountdownDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    document.getElementById('countdownDisplay').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function resetSequence() {
    checkboxes.forEach(id => {
        document.getElementById(id).classList.remove('checked');
    });
    // Disable Fire Enable checkbox
    document.getElementById('check3').classList.add('disabled');
}
