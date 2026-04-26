import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

// Mock IDs for demonstration
const USER_ID = "replace_with_real_user_id"; 
const COURSE_ID = "replace_with_real_course_id"; 

export default function CoursePlayer({ video }) {
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [maxPlayed, setMaxPlayed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [courseCompleted, setCourseCompleted] = useState(false);

  useEffect(() => {
    // 1. Replace iframe with YouTube IFrame API player
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      window.document.body.appendChild(script);
    }

    window.onYouTubeIframeAPIReady = () => {
      const newPlayer = new window.YT.Player(playerRef.current, {
        videoId: video.youtubeId,
        playerVars: { 
          controls: 1, 
          disablekb: 1, // Disable keyboard to prevent skipping
          rel: 0 
        },
        events: {
          onReady: (event) => setPlayer(event.target),
          onStateChange: handleStateChange
        }
      });
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, [video]);

  // Sync initial progress when video loads
  useEffect(() => {
    axios.get(`http://localhost:5000/course-progress?userId=${USER_ID}&courseId=${COURSE_ID}`)
      .then(res => {
        const vidProgress = res.data.progress.find(p => p.videoId === video._id);
        if (vidProgress) {
          setMaxPlayed(vidProgress.watchTime);
          setCompleted(vidProgress.completed);
        }
        setCourseCompleted(res.data.courseCompleted);
      });
  }, [video]);

  // Track progress every 5 seconds while playing
  useEffect(() => {
    let interval;
    if (player && player.getPlayerState() === window.YT.PlayerState.PLAYING) {
      interval = setInterval(() => {
        checkProgress();
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [player, maxPlayed]);

  const handleStateChange = (event) => {
    // If video ended naturally, mark complete
    if (event.data === window.YT.PlayerState.ENDED) {
      markVideoComplete();
    }
  };

  const checkProgress = async () => {
    if (!player) return;

    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();

    // 3. Prevent fake completion (handle seeking / skipping logic)
    // If user skipped more than 2 seconds ahead of their max watched time
    if (currentTime > maxPlayed + 2) {
      player.seekTo(maxPlayed);
      alert("Skipping forward is not allowed until you watch the video!");
      return;
    }

    const newMaxPlayed = Math.max(maxPlayed, currentTime);
    setMaxPlayed(newMaxPlayed);

    // Save to backend
    const res = await axios.post('http://localhost:5000/track-progress', {
      userId: USER_ID,
      courseId: COURSE_ID,
      videoId: video._id,
      watchTime: newMaxPlayed,
      duration: duration
    });

    if (res.data.progress.completed && !completed) {
      setCompleted(true);
      alert("Video completed!");
    }

    // Mark video as completed if user watches at least 90%
    if (newMaxPlayed >= duration * 0.9 && !completed) {
      markVideoComplete();
    }
  };

  const markVideoComplete = async () => {
    await axios.post('http://localhost:5000/mark-complete', {
      userId: USER_ID,
      videoId: video._id
    });
    setCompleted(true);
    
    // Refresh course progress to check if ALL videos are completed now
    const res = await axios.get(`http://localhost:5000/course-progress?userId=${USER_ID}&courseId=${COURSE_ID}`);
    setCourseCompleted(res.data.courseCompleted);
  };

  const downloadCertificate = () => {
    window.open(`http://localhost:5000/generate-certificate?userId=${USER_ID}&courseId=${COURSE_ID}`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>{video.title}</h2>
      
      {/* YouTube Player Container */}
      <div ref={playerRef} style={{ width: '100%', height: '450px', backgroundColor: '#000' }}></div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Progress Tracking</h3>
        <p><strong>Status:</strong> {completed ? "✅ Completed" : "⏳ In Progress"}</p>
        <p><strong>Watch Time:</strong> {Math.floor(maxPlayed)} seconds</p>
        
        {/* Progress Bar */}
        <div style={{ width: '100%', height: '10px', background: '#ddd', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${player && player.getDuration ? (maxPlayed / player.getDuration()) * 100 : 0}%`, 
            height: '100%', 
            background: completed ? '#4caf50' : '#2196f3',
            transition: 'width 0.5s'
          }}></div>
        </div>
      </div>

      {courseCompleted && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <h3>🎉 Congratulations! You have completed the entire course!</h3>
          <button 
            onClick={downloadCertificate} 
            style={{ padding: '15px 30px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}
          >
            Download Certificate
          </button>
        </div>
      )}
    </div>
  );
}
