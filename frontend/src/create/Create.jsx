import React, { useState } from 'react';

const videos = [
  { id: 1, title: 'React Tutorial', url: 'https://www.w3schools.com/html/mov_bbb.mp4', type: 'mp4' },
  { id: 2, title: 'MERN Stack Guide', url: 'https://www.w3schools.com/html/movie.mp4', type: 'mp4' },
  { id: 3, title: 'song', url: 'https://www.youtube.com/embed/9EtV6Bb7Vfg', type: 'youtube' },
  { id: 4, title: 'song', url: 'https://www.youtube.com/embed/IQvhUzVX030', type: 'youtube' },
  { id: 5, title: 'Dailymotion Video', url: 'https://www.dailymotion.com/embed/video/x7vo3q4', type: 'dailymotion' },
  { id: 6, title: 'movie', url: 'https://www.youtube.com/embed/_vFRK1LGWoE', type: 'youtube' },
  { id: 7, title: 'movie', url: 'https://www.youtube.com/embed/WglSfZJOPds?list=TLPQMjYwMjIwMjXBAHuHhv64kA', type: 'youtube' },
  { id: 8, title: 'song', url: 'https://www.youtube.com/embed/b_oWPrL9H7o', type: 'youtube' },
  { id: 9, title: 'song', url: 'https://www.youtube.com/embed/EiiOYwqk3A0?list=TLPQMjYwMjIwMjXBAHuHhv64kA', type: 'youtube' },
  { id: 10, title: 'soul land', url: 'https://www.youtube.com/embed/AtXBtbvNq2c', type: 'youtube' },
  { id: 11, title: 'soul land 2', url: 'https://www.youtube.com/embed/xwaBWEjU_qM?list=PLAV8AqZgfhJts3Nd6uRN7-oh0VfIkWExc', type: 'youtube' },
];

const VideoSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearchSubmitted(true);
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-container" style={{ textAlign: 'center', maxWidth: '800px', margin: 'auto' }}>
      <h1>Video Search</h1>
      <input
        type="text"
        placeholder="Search videos and press Enter..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleSearch}
        className="search-input"
        style={{ padding: '10px', width: '100%', marginBottom: '20px' }}
      />

      {!searchSubmitted ? (
        <p>Type and press Enter to search for videos.</p>
      ) : filteredVideos.length > 0 ? (
        <ul className="video-list" style={{ listStyle: 'none', padding: 0 }}>
          {filteredVideos.map(video => (
            <li key={video.id} className="video-card" style={{ marginBottom: '20px' }}>
              <h3>
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  {video.title}
                </a>
              </h3>
              {video.type === 'youtube' || video.type === 'dailymotion' ? (
                <iframe
                  width="560"
                  height="315"
                  src={video.url}
                  frameBorder="0"
                  allowFullScreen
                ></iframe>
              ) : (
                <video width="560" height="315" controls>
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No videos found.</p>
      )}
    </div>
  );
};

export default VideoSearch;